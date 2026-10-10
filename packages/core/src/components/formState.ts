import type {
  ErrorSchema,
  FieldPath,
  FieldPathList,
  FormContextType,
  GenericObjectType,
  StrictRJSFSchema,
  RJSFSchema,
  RJSFValidationError,
  SchemaContext,
  SchemaUtilsType,
  UiSchema,
  ValidationData,
} from '@rjsf/utils';
import {
  getByPath,
  setByPath,
  toPath,
  unsetByPath,
  createSchemaUtils,
  deepEquals,
  getChangedFields,
  getDiscriminatorFieldFromSchema,
  getUiOptions,
  getXxxOfKey,
  hashObject,
  isObject,
  isWholeValueSelect,
  isPlainObject,
  replaceEqualDeep,
  schemaHasNestedConditional,
  toErrorList,
  fieldPathToList,
  UI_GLOBAL_OPTIONS_KEY,
  UI_OPTIONS_KEY,
  validationDataMerge,
  ERRORS_KEY,
  ANY_OF_KEY,
  ONE_OF_KEY,
} from '@rjsf/utils';

import { buildRegistry } from '../Theme.ts';
import { ADDITIONAL_PROPERTY_KEY_REMOVE } from './constants.ts';
import type { FormProps, FormState } from './Form.tsx';
import type { EventFormData, IChangeEvent } from './IChangeEvent.ts';

/* The pure half of `Form`: what its state is derived from, and what each operation makes of it.
 *
 * Internal to `@rjsf/core`: `package.json` excludes `./lib/components/formState.js` from the `./lib/*.js` exports
 * wildcard so it can't be deep-imported, since a reachable subpath would have to keep working until the next major.
 */

/** The validation half of the state */
type ErrorState<T> = Pick<
  FormState<T>,
  'errors' | 'errorSchema' | 'schemaValidationErrors' | 'schemaValidationErrorSchema'
>;

/** The errors a change leaves: those on display, the validator's, and the fields' own they are built from */
type OwnedErrorState<T> = ErrorState<T> & Pick<FormState<T>, 'customErrors'>;

/** The form data as an event hands it back. The overload is the one trust point for `EventFormData`'s promise that an
 * object or array root is never `undefined`.
 */
export function toEventFormData<T>(formData: T | undefined): EventFormData<T>;
export function toEventFormData(formData: unknown): unknown {
  return formData;
}

/** `setFieldValue()`'s value, which its run-time path keeps `unknown`, in the type a field's `onChange` hands over.
 * The overload is the one trust point that the caller passes what the field at that path holds, the promise a field's
 * own `onChange` makes.
 */
export function asFieldValue<V>(value: unknown): V | undefined;
export function asFieldValue(value: unknown): unknown {
  return value;
}

/** Converts the full `FormState` into the `IChangeEvent` version by picking out the public values
 *
 * @param state - The state of the form
 * @param status - The status provided by the onSubmit
 * @returns - The `IChangeEvent` for the state
 */
export function toIChangeEvent<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(state: FormState<T, S, F>, status?: IChangeEvent['status']): IChangeEvent<T, S, F> {
  const { schema, uiSchema, schemaUtils, formData, errors, errorSchema } = state;
  return {
    schema,
    uiSchema,
    schemaUtils,
    formData: toEventFormData(formData),
    errors,
    errorSchema,
    ...(status !== undefined && { status }),
  };
}

/** A field change, applied by `applyChange()` */
export interface FieldChange<T> {
  /** The `FieldPath` into the formData/errorSchema at which the `newValue`/`newErrorSchema` will be set */
  fieldPath: FieldPath;
  /** The new value to set into the formData */
  newValue?: T;
  /** The field's own errors at `fieldPath`, if it raises any */
  newErrorSchema?: ErrorSchema<T>;
  /** For a change that moved the items of the array at `fieldPath`, where each one went; their errors go with them */
  newIndexOf?: ItemMove;
}

/** Where an array operation put the item that was at `index`: its new index, or `undefined` when it was removed */
export type ItemMove = (index: number) => number | undefined;

/** An `ItemMove` with the path of the array whose items it moved */
export interface AnnouncedMove {
  fieldPath: FieldPath;
  newIndexOf: ItemMove;
}

/** The part of the state that rendering derives from the props and the data alone: the schema utilities, the root and
 * resolved schemas, the uiSchema and the registry. Error and edit bookkeeping is the rest of `FormState`.
 */
type RenderContext<T, S extends StrictRJSFSchema, F extends FormContextType> = Pick<
  FormState<T, S, F>,
  | 'schemaUtils'
  | 'schema'
  | 'uiSchema'
  | 'retrievedSchema'
  | 'hasNestedConditionalSchema'
  | 'registry'
  | 'validationProps'
  | 'defaultsBehavior'
>;

/** Keeps the previous `schemaUtils` unless the props it was built from changed, in which case both it and the
 * nested-conditional flag, a pure function of its root schema, are rebuilt.
 */
function resolveSchemaUtils<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  prev: Pick<RenderContext<T, S, F>, 'schemaUtils' | 'hasNestedConditionalSchema'> | undefined,
): Pick<RenderContext<T, S, F>, 'schemaUtils' | 'hasNestedConditionalSchema'> {
  const { schema, validator, defaultFormStateBehavior, customMergeAllOf } = props;
  const schemaContext: SchemaContext<S, F> = { validator, defaultFormStateBehavior, customMergeAllOf };
  if (prev && !prev.schemaUtils.doesSchemaUtilsDiffer(schemaContext, schema)) {
    return prev;
  }
  const schemaUtils = createSchemaUtils<T, S, F>(schemaContext, schema);
  // A `dependencies`/`if` branch switch nested inside an object property never changes the ROOT retrieved schema (only
  // the schema's own top-level `dependencies`/`if` get resolved into it), so comparing the retrieved schema to the
  // previous one can't detect it (#5250). `hasNestedConditionalSchema` lets sanitization run anyway when that's
  // possible. It's a pure function of the root schema, so it only needs to be recomputed when `schemaUtils` (and thus
  // the root schema) is rebuilt.
  const rootSchema = schemaUtils.getRootSchema();
  return { schemaUtils, hasNestedConditionalSchema: schemaHasNestedConditional(rootSchema, rootSchema) };
}

/** `value` without its `undefined` entries, at any depth, so settings that spell a key out as `undefined` compare equal
 * to settings leaving it out, which `deepEquals()` alone does not see
 *
 * @param value - The settings to compare
 * @returns - `value` with every `undefined` entry of a plain object dropped
 */
function withoutUndefinedEntries(value: unknown): unknown {
  if (!isPlainObject(value)) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, withoutUndefinedEntries(entry)]),
  );
}

const UI_EMPTY_VALUE_KEY = 'ui:emptyValue';

/** The `ui:emptyValue`s of `uiSchema`, each where it sits: the one part of a uiSchema the defaults of a re-derive are
 * computed from, since `ui:initialValue` applies on mount and `reset()` only. Anything else it holds, a title or a
 * widget written inline, leaves the data as it is (#5294)
 *
 * @param uiSchema - The uiSchema, or the part of one, to collect from
 * @returns - An object mirroring `uiSchema` down to each `emptyValue`, or undefined when it has none
 */
function emptyValuesOf(uiSchema: unknown): unknown {
  // ponytail: a function-form `items` is skipped, so an `emptyValue` it returns never triggers a re-derive
  if (!isPlainObject(uiSchema) && !Array.isArray(uiSchema)) {
    return undefined;
  }
  const found: GenericObjectType = {};
  // Read the way `getDefaultFormState()` reads it, so the two cannot disagree about where an `emptyValue` is
  const { emptyValue } = Array.isArray(uiSchema) ? {} : getUiOptions(uiSchema as UiSchema);
  if (emptyValue !== undefined) {
    found[UI_EMPTY_VALUE_KEY] = emptyValue;
  }
  Object.entries(uiSchema).forEach(([key, value]) => {
    if (key === UI_EMPTY_VALUE_KEY || key === UI_OPTIONS_KEY) {
      return;
    }
    const nested = emptyValuesOf(value);
    if (nested !== undefined) {
      found[key] = nested;
    }
  });
  return Object.keys(found).length > 0 ? found : undefined;
}

/** Derives the `RenderContext` for the given `props` and resolved schema. The result is shared against `prev`, so a
 * value the parent rebuilt but did not change keeps the reference the fields already hold, functions included: a
 * changed template, widget or field is not mistaken for the old one, and the validator's compiled-schema cache and
 * the sanitize check, which compare the retrieved schema by reference, see the same object while it is unchanged.
 *
 * @param props - The current props
 * @param retrievedSchema - The schema resolved for the data the context is derived for
 * @param prev - The previous context, or the state holding one, whose references are retained where possible
 * @param resolved - The schema utilities for `props`, already resolved by the caller
 * @returns - The render context for the inputs
 */
function deriveRenderContext<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  retrievedSchema: S,
  prev: RenderContext<T, S, F> | undefined,
  resolved: Pick<RenderContext<T, S, F>, 'schemaUtils' | 'hasNestedConditionalSchema'>,
): RenderContext<T, S, F> {
  // Defaulted the way `doesSchemaUtilsDiffer()` defaults it, so going from no settings to `{}` is not a change either
  const { uiSchema = {}, customValidate, transformErrors, defaultFormStateBehavior = {} } = props;
  const { schemaUtils, hasNestedConditionalSchema } = resolved;
  const rootSchema = schemaUtils.getRootSchema();
  // Shared before `replaceEqualDeep()` sees it, which compares a function by identity: an `arrayMinItems`
  // `computeSkipPopulate` written inline would then make every render look like a change of the settings
  const defaultsBehavior =
    prev &&
    deepEquals(withoutUndefinedEntries(prev.defaultsBehavior), withoutUndefinedEntries(defaultFormStateBehavior))
      ? prev.defaultsBehavior
      : defaultFormStateBehavior;
  return replaceEqualDeep(prev, {
    schemaUtils,
    schema: rootSchema,
    uiSchema,
    retrievedSchema,
    hasNestedConditionalSchema,
    registry: buildRegistry(props, rootSchema, schemaUtils),
    validationProps: { customValidate, transformErrors },
    defaultsBehavior,
  });
}

/** Merges any `extraErrors` or `customErrors` into the given `schemaValidation` object, returning the result
 *
 * @param schemaValidation - The `ValidationData` object into which additional errors are merged
 * @param [extraErrors] - The extra errors from the props
 * @param [customErrors] - The customErrors from custom components
 * @return - The `extraErrors` and `customErrors` merged into the `schemaValidation`
 */
function mergeErrors<T>(
  schemaValidation: ValidationData<T>,
  extraErrors?: ErrorSchema<T>,
  customErrors?: ErrorSchema<T>,
): ValidationData<T> {
  let { errorSchema, errors } = schemaValidation;
  if (extraErrors) {
    const merged = validationDataMerge(schemaValidation, extraErrors);
    errorSchema = merged.errorSchema;
    errors = merged.errors;
  }
  if (customErrors) {
    const merged = validationDataMerge({ errors, errorSchema }, customErrors, true);
    errorSchema = merged.errorSchema;
    errors = merged.errors;
  }
  return { errors, errorSchema };
}

/** Validates the `formData` against the `schema` using the `schemaUtils` and the validation props, returning the
 * results.
 *
 * @param props - The props holding `customValidate`, `transformErrors`, `uiSchema` and `formContext`
 * @param context - The render context to validate with: its `schemaUtils` runs the validator and its `schema` is the
 *          constraint set. Its `retrievedSchema` is deliberately NOT used: whether the resolved schema may stand in
 *          for the root is the caller's to decide, which is what the separate parameter below is for.
 * @param formData - The form data to validate
 * @param [retrievedSchema] - An optionally pre-resolved schema to validate against instead of the context's `schema`
 */
export function validateFormData<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  context: RenderContext<T, S, F>,
  formData: T | undefined,
  retrievedSchema?: S,
): ValidationData<T> {
  const { schemaUtils, schema } = context;
  const { customValidate, transformErrors, uiSchema, formContext } = props;
  // When a pre-resolved schema is provided (e.g., from live validation), use it directly.
  // Otherwise validate against the original schema so AJV sees the full constraint set.
  const validationSchema = retrievedSchema ?? schema;
  // JSON.stringify drops keys with `undefined` values; JSON.parse on the result gives AJV a clean
  // object that avoids spurious type errors for `type: "string"` fields that were cleared (#4518).
  // Falsy root values (`false`, `0`, `''`) are valid data, so only `undefined` skips the round trip (#5404).
  const serializedFormData = JSON.stringify(formData);
  const validationFormData = serializedFormData === undefined ? undefined : JSON.parse(serializedFormData);

  // The data handed to `customValidate` carries defaults computed here rather than inside the validator, so they honor
  // the `customMergeAllOf` and `defaultFormStateBehavior` this form was given, which a validator has no way to know.
  // They are the schema's defaults rather than this form's current ones: `initialDefaultsGenerated` is deliberately
  // left unset, as it was in v6, so `ui:initialValue` is applied again and a field the user has cleared reaches
  // `customValidate` holding its initial value. Passed as a function so the work happens only if the validator uses
  // it, and so defaults that come out `undefined` are still an answer rather than looking like no answer at all
  const getCustomValidateFormData = customValidate
    ? () => schemaUtils.getDefaultFormState(validationSchema, validationFormData, true, undefined, uiSchema) as T
    : undefined;
  const schemaValidation = schemaUtils
    .getValidator()
    .validateFormData(
      validationFormData,
      validationSchema,
      customValidate,
      transformErrors,
      uiSchema,
      getCustomValidateFormData,
    );
  // ui:required only exists in the uiSchema, so it is enforced here rather than by rewriting the schema the
  // validator sees: that keeps the submit and live paths, precompiled validators and AJV error paths unchanged.
  // Read off the same props as `uiSchema`, not the context's registry, which lags the props until the form commits
  // them; normalized as `buildRegistry()` does, so a function-form `uiSchema.items` sees what it sees while rendering
  const uiRequiredErrorSchema = schemaUtils.getUiRequiredErrorSchema(
    uiSchema,
    formData,
    undefined,
    uiSchema?.[UI_GLOBAL_OPTIONS_KEY],
    formContext ?? ({} as F),
  );
  if (Object.keys(uiRequiredErrorSchema).length === 0) {
    return schemaValidation;
  }
  return validationDataMerge<T>(schemaValidation, uiRequiredErrorSchema);
}

/** Performs live validation and then returns the errors and error schemas with `extraErrors` and `customErrors`
 * merged in, alongside the validator's own results.
 *
 *
 * @param props - The current props
 * @param context - The render context to validate with; see `validateFormData()`
 * @param formData - The form data to validate
 * @param [customErrors] - The customErrors from custom components
 * @param [retrievedSchema] - The schema resolved for the branch `formData` selects, when it still describes it; the
 *          root schema is the full constraint set, so a resolved schema, which has had the root's `if`,
 *          `dependencies` and `$ref`s folded into it, drops the errors those keywords report (`must match "then"
 *          schema`, the `oneOf` miss) and may stand in only while it describes the data. Omitting extra data keeps
 *          that true, since the fields it drops are by definition not in the schema that selects the branch; a prop
 *          change does not, which is why the derivation passes it only when nothing that resolves it changed.
 * @returns - An object containing `errorSchema`, `errors`, `schemaValidationErrors` and `schemaValidationErrorSchema`
 */
function runLiveValidation<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  context: RenderContext<T, S, F>,
  formData: T | undefined,
  customErrors?: ErrorSchema<T>,
  retrievedSchema?: S,
) {
  const schemaValidation = validateFormData(props, context, formData, retrievedSchema);
  const { errors: schemaValidationErrors, errorSchema: schemaValidationErrorSchema } = schemaValidation;
  const mergedErrors = mergeErrors(schemaValidation, props.extraErrors, customErrors);
  return { ...mergedErrors, schemaValidationErrors, schemaValidationErrorSchema };
}

/** Whether `prefix` addresses `path` itself or a container holding it, comparing the segments the way `toPath()` spells
 * them, so a numeric array index and its string form are the same segment
 *
 * @param prefix - The path that may lead into `path`
 * @param path - The path being addressed
 * @returns - True when every segment of `prefix` opens `path`
 */
function isPathPrefix(prefix: FieldPathList, path: FieldPathList): boolean {
  return prefix.length <= path.length && prefix.every((segment, i) => String(segment) === String(path[i]));
}

/** The path an `RJSFValidationError` addresses, the same way `toErrorSchema()` splits it */
function errorPath(error: RJSFValidationError): string[] {
  return error.property ? toPath(error.property) : [];
}

/** A copy of `errorSchema` without the `__errors` of the nodes `isDropped` names, if any, and without the nodes that
 * hold nothing, an empty `__errors` included, which a raise at an ancestor would read as errors still being there.
 * `path` is that of `errorSchema` itself
 */
function pruneErrorSchema(
  errorSchema: ErrorSchema,
  isDropped: (path: FieldPathList) => boolean = () => false,
  path: FieldPathList = [],
): ErrorSchema {
  const kept: ErrorSchema = {};
  for (const [key, value] of Object.entries(errorSchema)) {
    if (key === ERRORS_KEY) {
      if (Array.isArray(value) && value.length > 0 && !isDropped(path)) {
        // Copied, so the form does not hold on to an array the field that raised it may go on to change
        kept[key] = [...value];
      }
    } else {
      const child = isPlainObject(value) ? pruneErrorSchema(value, isDropped, [...path, key]) : value;
      if (!isPlainObject(child) || Object.keys(child).length > 0) {
        kept[key] = child;
      }
    }
  }
  return kept;
}

/** `validation` without the errors at the paths `isDropped` names, the list and the `ErrorSchema` by one rule. An
 * error with neither a `property` nor a `message`, which is how an invalid schema is reported, is in the list only and
 * names no field, so it stays
 */
function withoutErrors<T>(
  validation: ValidationData<T>,
  isDropped: (path: FieldPathList) => boolean,
): ValidationData<T> {
  return {
    errors: validation.errors.filter(
      (error) => (error.property === undefined && !error.message) || !isDropped(errorPath(error)),
    ),
    errorSchema: pruneErrorSchema(validation.errorSchema, isDropped),
  };
}

/** `getByPath()` reading an empty path as the root itself. The overload is the one trust point that the value at a
 * field's path has the type that field renders.
 */
export function getAt<V>(data: unknown, segments: FieldPathList): V;
export function getAt(data: unknown, segments: FieldPathList): unknown {
  return segments.length === 0 ? data : getByPath(data, segments);
}

/** A copy of `errorSchema` with the node at `path` replaced by `node`, pruned, so a `node` that holds nothing is gone */
function replaceErrorSchemaNode<T>(
  errorSchema: ErrorSchema<T>,
  path: FieldPathList,
  node: ErrorSchema<T>,
): ErrorSchema<T> {
  // An `ErrorSchema` nests plain objects even at numeric segments, so never auto-vivify arrays
  return pruneErrorSchema(path.length === 0 ? node : setByPath(copyAlongPath(errorSchema, path), path, node, true));
}

/** The index a path segment names, if it names one */
function itemIndex(segment: string | number | undefined): number | undefined {
  return /^(0|[1-9]\d*)$/.test(String(segment)) ? Number(segment) : undefined;
}

/** `errorSchema` after the items of the array at `path` moved: each item's errors sit at the item's new index and those
 * of a removed item are gone. The array's own, such as `minItems`, belong to no item and stay
 */
function moveItemErrorSchema<T>(
  errorSchema: ErrorSchema<T>,
  path: FieldPathList,
  newIndexOf: ItemMove,
): ErrorSchema<T> {
  const moved: ErrorSchema = {};
  for (const [key, node] of Object.entries(getAt<ErrorSchema | undefined>(errorSchema, path) ?? {})) {
    const index = itemIndex(key);
    const newKey = index === undefined ? key : newIndexOf(index);
    if (newKey !== undefined) {
      moved[newKey] = node;
    }
  }
  return replaceErrorSchemaNode(errorSchema, path, moved);
}

/** `validation` after the items of the array at `path` moved, the list by the rule `moveItemErrorSchema()` moves the
 * `ErrorSchema` by. A moved error keeps what the validator said of it, under the item's new `property`
 */
function moveItemErrors<T>(
  validation: ValidationData<T>,
  path: FieldPathList,
  newIndexOf: ItemMove,
): ValidationData<T> {
  const errors = validation.errors.flatMap((error) => {
    const pathOfError = errorPath(error);
    const index = isPathPrefix(path, pathOfError) ? itemIndex(pathOfError[path.length]) : undefined;
    const newIndex = index === undefined ? index : newIndexOf(index);
    if (newIndex === index) {
      return [error];
    }
    if (newIndex === undefined) {
      return [];
    }
    const property = `.${[...pathOfError.slice(0, path.length), newIndex, ...pathOfError.slice(path.length + 1)].join('.')}`;
    // A stack that names the field by its title instead of its `property` says nothing of the index
    const isStackOfProperty = error.stack === `${error.property} ${error.message}`;
    return [{ ...error, property, stack: isStackOfProperty ? `${property} ${error.message}` : error.stack }];
  });
  return { errors, errorSchema: moveItemErrorSchema(validation.errorSchema, path, newIndexOf) };
}

/** The errors of `current` after `change`, before any validation of the changed data. The fields' own errors are kept
 * apart from the validator's, which the next validation and a parent replacing the data both rewrite, so a field's
 * raise outlives either until the field raises again (#5347).
 *
 * A change that moved the items of an array moves the errors of both with them. The validator's errors of the fields
 * whose values the change replaced, `changed`, go the way `reconcileErrors()` drops them for replaced data: they
 * describe values that are gone, and the next validation rewrites them anyway. One that raises errors replaces the
 * field's own at its path, an empty raise included, and takes the validator's off that path until the form validates
 * again: the raise is the field's say over its path. One that raises none clears the field's own `__errors` there.
 *
 * @param current - The state the change applies to
 * @param change - The change
 * @param extraErrors - The `extraErrors` prop, which the displayed errors carry
 * @param [changed] - The paths of the fields whose values the change replaced, see `changedPaths()`
 * @returns - The error members of the state after the change, `current`'s own when the change left them as they were
 */
export function applyChangeToErrors<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  { fieldPath, newErrorSchema, newIndexOf }: FieldChange<T>,
  extraErrors: ErrorSchema<T> | undefined,
  changed: FieldPathList[] = [],
): OwnedErrorState<T> {
  const { errors, errorSchema, schemaValidationErrors, schemaValidationErrorSchema } = current;
  const path = fieldPathToList(fieldPath);
  let { customErrors } = current;
  const hasOwnErrors = getByPath<string[]>(customErrors, [...path, ERRORS_KEY], []).length > 0;
  if (!newIndexOf && !newErrorSchema && !hasOwnErrors && changed.length === 0) {
    return { errors, errorSchema, schemaValidationErrors, schemaValidationErrorSchema, customErrors };
  }
  // The validator's own result is the base `extraErrors` and the fields' own errors are merged onto again, as in
  // `reconcileErrors()`: `errors` and `errorSchema` already carry them, so merging onto those would add each a second
  // time on every change (#5041)
  let validation: ValidationData<T> = { errors: schemaValidationErrors, errorSchema: schemaValidationErrorSchema };
  if (newIndexOf) {
    validation = moveItemErrors(validation, path, newIndexOf);
    customErrors = customErrors && moveItemErrorSchema(customErrors, path, newIndexOf);
  }
  validation = withoutErrorsOfChanged(validation, changed);
  if (newErrorSchema) {
    validation = withoutErrors(validation, (pathOfError) => isPathPrefix(path, pathOfError));
    customErrors = replaceErrorSchemaNode(customErrors ?? {}, path, newErrorSchema);
  } else if (customErrors && hasOwnErrors) {
    customErrors = pruneErrorSchema(
      customErrors,
      (pathOfError) => pathOfError.length === path.length && isPathPrefix(path, pathOfError),
    );
  }
  return {
    ...mergeErrors(validation, extraErrors, customErrors),
    schemaValidationErrors: validation.errors,
    schemaValidationErrorSchema: validation.errorSchema,
    customErrors,
  };
}

/** The data a derivation pass settles on, with what it took to get there */
interface DerivedData<T, S extends StrictRJSFSchema, F extends FormContextType> {
  /** The data after defaults and, when asked for, sanitization */
  formData: T;
  /** The render context for `formData`, carrying the schema resolved for it and the utilities that resolved it.
   * Every value in it is `current`'s own whenever nothing it is built from changed, so committing it always is
   * free; handing it back rather than the parts is what keeps state from holding a `retrievedSchema` resolved by
   * utilities it does not also hold.
   */
  context: RenderContext<T, S, F>;
  /** `context.schemaUtils` is `current`'s own: nothing the schema is resolved with changed, so the resolved schema in
   * `context` was produced for `formData` by the very utilities the committed state validates with, and may stand in
   * for the root when validating; see `runLiveValidation()`
   */
  areSchemaUtilsReused: boolean;
}

/** The schema resolved for `formData`. Resolving walks the whole root schema, so it is skipped outright when the
 * utilities and the data they resolve for are both the ones `current.retrievedSchema` was resolved from. Otherwise the
 * result is shared against the committed schema, so rebuilt utilities handing back a deep-equal schema still compare
 * equal by identity instead of triggering a sanitize pass.
 *
 * @param current - The state the pass starts from; `undefined` on construction
 * @param schemaUtils - The utilities to resolve with
 * @param formData - The data to resolve the schema for
 * @returns - The resolved schema, shared with `current.retrievedSchema` where possible
 */
function resolveRetrievedSchema<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  schemaUtils: SchemaUtilsType<T, S, F>,
  formData: T | undefined,
): S {
  if (current?.schemaUtils === schemaUtils && current.formData === formData) {
    return current.retrievedSchema;
  }
  return replaceEqualDeep(current?.retrievedSchema, schemaUtils.retrieveSchema(schemaUtils.getRootSchema(), formData));
}

/** How one data pass differs from the default, which just fills in the missing defaults */
interface DeriveDataOptions<T, S extends StrictRJSFSchema, F extends FormContextType> {
  /** Attempt to sanitize the data for a retrieved schema that changed. A function decides it only once the retrieved
   * schema is known to have changed, so a check it makes costs nothing on the passes that never sanitize
   */
  shouldSanitize?: boolean | ((schemaUtils: SchemaUtilsType<T, S, F>, retrievedSchema: S, formData: T) => boolean);
  /** This pass originated from `reset()`: it computes defaults the same way an initial render does even though the
   * instance has generated defaults before
   */
  isReset?: boolean;
}

/** Settles the data for `props` and `inputFormData`: any missing required defaults are filled in, then, when asked,
 * the result is sanitized for its resolved schema until the two stop moving. Every caller that needs derived data
 * goes through here, so the resolved schema and the data it describes are always produced together.
 *
 * @param current - The state the pass starts from; `undefined` on construction
 * @param inputFormData - The data to settle; `undefined` computes defaults from nothing
 * @param options - How this pass differs from the default
 * @param props - The current props
 * @returns - The settled data and the render context carrying the schema that was resolved for it
 */
function deriveFormData<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  inputFormData: T | undefined,
  options: DeriveDataOptions<T, S, F>,
  props: FormProps<T, S, F>,
): DerivedData<T, S, F> {
  const { shouldSanitize = false, isReset = false } = options;
  const { uiSchema = {} } = props;
  const resolved = resolveSchemaUtils(props, current);
  const { schemaUtils, hasNestedConditionalSchema } = resolved;
  // Compared through `schemaUtils` rather than by the identity of `resolved` itself, which holds only because
  // `resolveSchemaUtils()` hands `current` straight back: narrowing it to a copy would silently make this false
  // forever, and with it every reuse below
  const areSchemaUtilsReused = resolved.schemaUtils === current?.schemaUtils;
  const rootSchema = schemaUtils.getRootSchema();

  let defaultsFormData: T | undefined = inputFormData;
  // The data is shared against the committed data when there is some, so an unchanged subtree keeps the reference the
  // fields hold; on construction, against the caller's own value
  const shareBase = current ? current.formData : defaultsFormData;
  // A reset re-runs the same "initial" defaults pass a first render does, so `ui:initialValue` applies again even
  // though this instance has generated defaults before.
  const initialDefaultsGenerated = (current?.initialDefaultsGenerated ?? false) && !isReset;
  let formData: T;
  let retrievedSchema: S;
  let wasSanitized = false;
  const preventInfiniteSanitize: string[] = [];
  let sanitize = shouldSanitize;
  do {
    formData = replaceEqualDeep(
      shareBase,
      schemaUtils.getDefaultFormState(rootSchema, defaultsFormData, false, initialDefaultsGenerated, uiSchema) as T,
    );
    retrievedSchema = resolveRetrievedSchema(current, schemaUtils, formData);
    const mayNeedSanitizing = hasNestedConditionalSchema || retrievedSchema !== current?.retrievedSchema;
    if (mayNeedSanitizing && typeof sanitize === 'function') {
      // Asked once, since it decides about the change rather than about the data each pass settles
      sanitize = sanitize(schemaUtils, retrievedSchema, formData);
    }
    const isSanitizing = mayNeedSanitizing && sanitize === true;
    // Only hash when sanitizing, wrapping `formData` in an object to deal with a scalar/undefined value
    const formHash = isSanitizing ? hashObject({ formData }) : '';
    if (isSanitizing && !preventInfiniteSanitize.includes(formHash)) {
      // Sanitize the form data if shouldSanitize is true, we haven't already processed this same formData AND
      // either the retrieved schema changed or the schema has a nested conditional that the check above can't see
      const sanitizedFormData = replaceEqualDeep(
        formData,
        schemaUtils.sanitizeDataForNewSchema(retrievedSchema, current?.retrievedSchema, formData),
      );
      wasSanitized = sanitizedFormData !== formData;
      if (wasSanitized) {
        // Update both the formData AND defaultsFormData due to the sanitize so the loop works with the new data
        formData = sanitizedFormData;
        defaultsFormData = sanitizedFormData;
        const sanitizedFormHash = hashObject({ formData: sanitizedFormData });
        // If we've seen the sanitized data before, we are done
        wasSanitized = !preventInfiniteSanitize.includes(sanitizedFormHash);
        preventInfiniteSanitize.push(sanitizedFormHash);
      }
      preventInfiniteSanitize.push(formHash);
    } else {
      wasSanitized = false;
    }
  } while (wasSanitized);

  // Always derived, never skipped on the grounds that the schema utilities were reused: the registry is built from
  // `idPrefix`, `widgets`, `templates`, `fields`, `formContext` and `uiSchema` too, none of which the utilities are
  // resolved from. `deriveRenderContext()` shares its result against `current`, so an unchanged context keeps every
  // reference the fields hold.
  const context = deriveRenderContext(props, retrievedSchema, current, resolved);
  return { formData, context, areSchemaUtilsReused };
}

/** What reconciling the errors of a derivation needs to know */
interface ErrorOptions<S> {
  /** The schema changed, so the existing errors describe another schema and are dropped */
  isSchemaChanged?: boolean;
  /** Live validation runs for this pass; otherwise the committed validation results are carried forward */
  mustValidate: boolean;
  /** The schema to validate with in place of the root, when it still describes the data; see `runLiveValidation()` */
  validationSchema?: S;
  /** Returns the path of each `formData` field that changed, the root's being the empty path; called only when live
   * validation does not run, which is when those paths are needed to clear the fields' errors
   */
  getChangedPaths?: () => FieldPathList[];
}

/** The path of each field that differs between two values of the form's data, split the way `toErrorSchema()` splits
 * an error's property, so the two address the same entry. The empty path stands for a difference that cannot be
 * narrowed below the root: a primitive, an array whose length changed, or a change of type
 */
function changedPaths(formData: unknown, previous: unknown): FieldPathList[] {
  if (formData === previous) {
    return [];
  }
  const isMatched =
    (isPlainObject(formData) && isPlainObject(previous)) ||
    (Array.isArray(formData) && Array.isArray(previous) && formData.length === previous.length);
  if (!isMatched) {
    return [[]];
  }
  // Wrapped, so that a root array is descended into by index the way an array below the root is
  return getChangedFields({ root: formData }, { root: previous }, true).map((field) => toPath(field).slice(1));
}

/** `validation` without the errors of the fields at the `changed` paths: a changed field's errors go, with those of
 * everything below it. Every container holding the field changed along with it, the root included, so an error of
 * their own, such as the `uniqueItems` of the array the field sits in, goes too. Only their own: the other fields they
 * hold did not change and keep theirs. A change of the root itself takes every error with it.
 */
function withoutErrorsOfChanged<T>(validation: ValidationData<T>, changed: FieldPathList[]): ValidationData<T> {
  if (changed.length === 0) {
    return validation;
  }
  if (changed.some((pathOfField) => pathOfField.length === 0)) {
    return { errors: [], errorSchema: {} };
  }
  return withoutErrors(validation, (pathOfError) =>
    changed.some((pathOfField) => isPathPrefix(pathOfField, pathOfError) || isPathPrefix(pathOfError, pathOfField)),
  );
}

/** `data` with the items of the array at `path` where `newIndexOf` put them, as many as the array holds in `changed`:
 * diffed against `changed`, a moved item is no change and an added one is, so the errors that moved with an item are
 * kept and those of a value that is gone are not
 */
function withItemsMoved<T>(data: T, changed: T, path: FieldPathList, newIndexOf: ItemMove): T;
function withItemsMoved(data: unknown, changed: unknown, path: FieldPathList, newIndexOf: ItemMove): unknown {
  const items = getAt<unknown>(data, path);
  const newItems = getAt<unknown>(changed, path);
  if (!Array.isArray(items) || !Array.isArray(newItems)) {
    return data;
  }
  const moved: unknown[] = [];
  moved.length = newItems.length;
  items.forEach((item, index) => {
    const newIndex = newIndexOf(index);
    if (newIndex !== undefined && newIndex < moved.length) {
      moved[newIndex] = item;
    }
  });
  return path.length === 0 ? moved : setByPath(copyAlongPath(data, path), path, moved);
}

/** Reconciles the errors for a derivation, either by validating `formData` or by carrying the committed validation
 * results forward, dropping the ones of fields that changed, and merging `extraErrors` and the custom errors onto them.
 *
 * @param current - The state the pass starts from; `undefined` on construction
 * @param props - The current props
 * @param context - The render context derived for `formData`
 * @param formData - The data the errors are for
 * @param options - How this pass reconciles its errors
 * @returns - The errors to display and the validator's own results they were built from
 */
function reconcileErrors<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  props: FormProps<T, S, F>,
  context: RenderContext<T, S, F>,
  formData: T | undefined,
  options: ErrorOptions<S>,
): ErrorState<T> {
  const { isSchemaChanged = false, mustValidate, validationSchema, getChangedPaths = () => [] } = options;
  if (mustValidate) {
    return runLiveValidation(props, context, formData, current?.customErrors, validationSchema);
  }
  // oxlint-disable-next-line typescript/no-deprecated
  const isErrorStateDropped = props.noValidate || isSchemaChanged;
  // If the `props.noValidate` option is set or the schema has changed, we reset the error state: every error describes
  // the value that was replaced. Otherwise the base has to be the validator's own result, since `extraErrors` and
  // `customErrors` are merged in below and `state.errors` already carries them, which would merge each in a second time
  const validation: ValidationData<T> = isErrorStateDropped
    ? { errors: [], errorSchema: {} }
    : withoutErrorsOfChanged(
        { errors: current?.schemaValidationErrors ?? [], errorSchema: current?.schemaValidationErrorSchema ?? {} },
        getChangedPaths(),
      );
  return {
    ...mergeErrors(validation, props.extraErrors, current?.customErrors),
    schemaValidationErrors: validation.errors,
    schemaValidationErrorSchema: validation.errorSchema,
  };
}

/** Whether a pass validates its data: only under `liveValidate: 'onChange'`, only for data that is there, and only when
 * something the errors depend on changed, so a parent re-render that touches neither the data nor the validation
 * shows no error the user has not earned yet. `'onBlur'` owns its validation pass in `onBlur()`.
 */
function mustLiveValidate<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  edit: boolean,
  isInputChanged: boolean,
): boolean {
  return edit && isLiveValidated(props) && isInputChanged;
}

/** Whether the form validates its data on every change */
export function isLiveValidated<T, S extends StrictRJSFSchema, F extends FormContextType>(props: FormProps<T, S, F>) {
  // oxlint-disable-next-line typescript/no-deprecated
  return !props.noValidate && props.liveValidate === 'onChange';
}

/** Whether the form validates its data when a field is blurred */
export function isBlurValidated<T, S extends StrictRJSFSchema, F extends FormContextType>(props: FormProps<T, S, F>) {
  // oxlint-disable-next-line typescript/no-deprecated
  return !props.noValidate && props.liveValidate === 'onBlur';
}

/** What changed between the committed state and a context derived from the current props, read off the references
 * the derivation shared: a member is a new object exactly when an input it is built from changed
 */
function detectContextChanges<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  context: RenderContext<T, S, F>,
) {
  if (!current) {
    return { isSchemaChanged: false, isValidationPropChanged: false };
  }
  return {
    isSchemaChanged: context.schema !== current.schema,
    // The utilities carry the schema, the validator and the merge settings; the callbacks are the rest
    isValidationPropChanged:
      context.schemaUtils !== current.schemaUtils || context.validationProps !== current.validationProps,
  };
}

/** The state derived from data: on construction from the seed the props hand the form, from a `formData` prop that
 * replaces the data, and from the data the form holds whenever the schema, a `ui:emptyValue` or
 * `defaultFormStateBehavior` changed, since those are the props whose change transforms the data (a default it did not
 * have before, a branch that no longer applies). No other prop change runs this: an unrelated re-render must not rerun
 * value initialization, so `deriveState()` re-derives the render context alone for those.
 *
 * @param current - The state the pass starts from; `undefined` on construction
 * @param inputFormData - The data to derive from
 * @param props - The current props
 * @param isSeeded - Whether the props handed `inputFormData` over, rather than `current` holding it
 * @returns - The new state, sharing every unchanged subtree with `current`
 */
function deriveDataState<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  inputFormData: T | undefined,
  props: FormProps<T, S, F>,
  isSeeded = current === undefined,
): FormState<T, S, F> {
  const { formData, context, areSchemaUtilsReused } = deriveFormData(current, inputFormData, {}, props);
  const { isSchemaChanged, isValidationPropChanged } = detectContextChanges(current, context);
  const edit = isSeeded || !current ? inputFormData !== undefined : current.edit;
  // Construction validates nothing: the errors of a seed the user has not touched are not shown until they are earned
  const isDataChanged = current !== undefined && formData !== current.formData;
  const errors = reconcileErrors(current, props, context, formData, {
    isSchemaChanged,
    mustValidate: mustLiveValidate(props, edit, isDataChanged || isValidationPropChanged),
    validationSchema: areSchemaUtilsReused ? context.retrievedSchema : undefined,
    // Without a validation pass, the errors of the fields the data changed at describe values that are gone. The
    // data is shared against the committed data, so unchanged subtrees are skipped by identity
    getChangedPaths: current && (() => changedPaths(formData, current.formData)),
  });
  return {
    ...current,
    ...context,
    formData,
    edit,
    ...errors,
    initialDefaultsGenerated: true,
  };
}

/** Freezes plain objects and arrays in `data`, and nothing else: a `File`, a `Date` or a class instance is left
 * alone. Development only, and only ever applied to form data: the form data a consumer receives shares subtrees with
 * the value the change was applied to, the `formData` the consumer passed included, so a mutation of it corrupts the
 * consumer's state silently. Frozen, it throws where the mutation happens instead.
 *
 * @param data - The form data to freeze
 */
export function freezeFormData(data: unknown) {
  if ((!Array.isArray(data) && !isPlainObject(data)) || Object.isFrozen(data)) {
    return;
  }
  Object.freeze(data);
  for (const value of Object.values(data)) {
    freezeFormData(value);
  }
}

declare const process: { env: Record<string, string | undefined> };
/** Whether the development diagnostics run. Vite and esbuild replace `process.env.NODE_ENV` but not `typeof process`,
 * and a browser has no `process`, so only the replaced expression is read; the `catch` covers an environment that
 * neither replaces nor defines it. Because the check is hoisted into a `const`, a minifier cannot fold it, so the
 * diagnostics ship in production bundles too and only skip at run time.
 */
export const isDevelopment = (() => {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
})();

/** Returns `data` with every container along `path` shallow-copied, leaving the copies ready for a write at that
 * path that must not touch the original. Subtrees off the path keep the reference the fields already hold, so
 * nothing has to walk the data afterwards to restore the sharing a deep clone would have destroyed. Stops where
 * the path runs off the end of what is actually there, since `setByPath()` creates the rest itself; the copies made
 * up to that point are what keeps it from creating them inside a container the committed state still holds.
 *
 * @param data - The data to copy along `path`
 * @param path - The path whose containers are copied
 * @returns - The copied data, or `data` itself when it holds no containers to copy
 */
function copyAlongPath<T>(data: T, path: FieldPathList): T {
  if (!isObject(data) && !Array.isArray(data)) {
    return data;
  }
  const copyOf = (container: object) => (Array.isArray(container) ? [...container] : { ...container });
  const root = copyOf(data as object) as Record<PropertyKey, unknown>;
  let container = root;
  for (const segment of path.slice(0, -1)) {
    const child = container[segment];
    if (!isObject(child) && !Array.isArray(child)) {
      break;
    }
    const copy = copyOf(child as object) as Record<PropertyKey, unknown>;
    container[segment] = copy;
    container = copy;
  }
  return root as T;
}

/** Returns the schema of the `property` of an object `schema` as it is rendered: the schema's own, or else that of the
 * `oneOf`/`anyOf` option `MultiSchemaField` renders for `formData`, which it picks as the closest match to it, looked up
 * the same way
 *
 * @param schemaUtils - The schema utilities to retrieve the options and pick among them with
 * @param schema - The object schema, retrieved for `formData`
 * @param property - The name of the property
 * @param formData - The object's data
 * @returns - The property's schema, or undefined when neither the schema nor any option it renders declares it
 */
function getPropertySchemaAt<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  schema: S,
  property: string,
  formData: T,
): S | undefined {
  const ownSchema = schema.properties?.[property];
  const xxxOfKey = getXxxOfKey<S>(schema);
  if (ownSchema !== undefined || !xxxOfKey) {
    return ownSchema as S | undefined;
  }
  const options = schema[xxxOfKey]!.map((option) => schemaUtils.retrieveSchema(option as S, formData));
  const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
  const option = options[schemaUtils.getClosestMatchingOption(formData, options, 0, discriminator)];
  // The option is rendered by a `SchemaField` of its own, which renders the option's own `oneOf`/`anyOf` in turn
  return option && getPropertySchemaAt<T, S, F>(schemaUtils, option, property, formData);
}

/** Whether the field at `path` is a select over object or array constants. Changing one sets a single value, the way
 * changing a leaf does, rather than writing a container of values whose own fields raise their changes. The schema is
 * retrieved at every step of the path, so a field an `allOf`, a condition or a `oneOf`/`anyOf` option declares is found
 * as it is rendered, and an array index is followed through `items`.
 *
 * @param schemaUtils - The schema utilities to retrieve and search the schema with
 * @param schema - The root schema, retrieved for `formData`
 * @param path - The path of the changed field
 * @param formData - The data the schema was retrieved for, which holds the field's new value
 * @returns - True when the field is such a select
 */
function isWholeValueSelectAt<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  schema: S,
  path: FieldPathList,
  formData: T,
): boolean {
  let fieldSchema = schema;
  let fieldData: unknown = formData;
  for (const segment of path) {
    let childSchema: S | undefined;
    if (typeof segment === 'number') {
      const { items, additionalItems } = fieldSchema;
      childSchema = (Array.isArray(items) ? (items[segment] ?? additionalItems) : items) as S | undefined;
    } else {
      childSchema = getPropertySchemaAt<T, S, F>(schemaUtils, fieldSchema, segment, fieldData as T);
    }
    if (!isObject(childSchema)) {
      return false;
    }
    fieldData = getByPath(fieldData, segment);
    fieldSchema = schemaUtils.retrieveSchema(childSchema, fieldData as T);
  }
  return isWholeValueSelect<S>(fieldSchema);
}

/** Applies one `change` to `current`, returning the next state. The `newValue` is set at the change's path in the
 * data, which is then run through `deriveFormData()` for any missing defaults and, when the resolved schema changed,
 * sanitization. If `omitExtraData` and `liveOmit` are turned on, the data is filtered to remove any extra data not in
 * a form field. The errors the form holds are changed as `applyChangeToErrors()` describes; then the data is validated
 * if required. Reads nothing but its arguments and performs no callbacks: committing the result and notifying are the
 * caller's.
 *
 * @param current - The state the change applies to
 * @param change - The change to apply
 * @param props - The current props
 * @returns - The next state, sharing every unchanged subtree with `current`
 */
export function applyChange<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  change: FieldChange<T>,
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  const { newValue, fieldPath } = change;
  // The single place where a `FieldPath` is parsed back into segments for writing into the formData
  const path = fieldPathToList(fieldPath);
  const { extraErrors, omitExtraData, liveOmit, disabled, readonly } = props;
  const { formData: oldFormData } = current;
  // The derivation below hands back the context for the data it settled on, resolved schema included, so committing
  // whatever it returns is what keeps state's resolved schema and the utilities that resolved it in step.
  let context: RenderContext<T, S, F> = current;
  const isRootPath = path.length === 0;
  let formData: T | undefined;
  if (isRootPath) {
    formData = newValue;
  } else if (isObject(oldFormData) || Array.isArray(oldFormData)) {
    // The write below lands on copies of the containers along the path; everything off it keeps the reference the
    // fields hold, and nothing has to be walked afterwards to restore that sharing
    formData = copyAlongPath(oldFormData, path);
  } else {
    // A field edit under an empty root, a `null` seed or a cleared scalar, creates the container the field lives in
    // instead of being dropped
    formData = (typeof path[0] === 'number' ? [] : {}) as T;
  }

  // When switching from null to an object option in oneOf, MultiSchemaField sends
  // an object with property names but undefined values (e.g., {types: undefined, content: undefined}).
  // In this case, pass undefined to deriveFormData to trigger fresh default computation.
  // Only do this when the previous formData was null/undefined (switching FROM null).
  const hasOnlyUndefinedValues =
    isObject(formData) && Object.keys(formData).length > 0 && Object.values(formData).every((v) => v === undefined);
  const wasPreviouslyNull = oldFormData === null || oldFormData === undefined;
  const inputForDefaults = hasOnlyUndefinedValues && wasPreviouslyNull ? undefined : formData;

  if (isObject(formData) || Array.isArray(formData)) {
    // Tracks if the user cleared a plain (non-oneOf/anyOf) leaf field.
    // The key is removed twice: once before deriveFormData so inputForDefaults
    // reflects an empty field for conditional schema resolution, and once after so
    // the user's clear overrides any schema default deriveFormData re-applied (#5125)
    // and AJV never receives { key: undefined } for type:"string" fields (#4518).
    let plainLeafWasCleared = false;

    if (newValue === ADDITIONAL_PROPERTY_KEY_REMOVE) {
      // For additional properties, this key was explicitly removed, so unset it
      unsetByPath(formData, path);
    } else if (!isRootPath) {
      // Set the new value at its path in the form data.
      let valueForPath: T | null | undefined = newValue;

      if (newValue === undefined) {
        const lastSegment = path[path.length - 1];
        if (typeof lastSegment === 'number') {
          // Array items: match ArrayField `handleChange` — AJV needs `null`, not undefined.
          valueForPath = null;
        } else {
          const { field: leaf } = current.schemaUtils.findFieldInSchema(current.schema, path, oldFormData);
          const isOneOfOrAnyOfLeaf = leaf && (ONE_OF_KEY in leaf || ANY_OF_KEY in leaf);
          // oneOf/anyOf and unresolved leaves keep `undefined` so mergeDefaults doesn't
          // re-apply a branch default when the user clears the widget.
          // Plain resolved leaves use plainLeafWasCleared instead (see below).
          if (!isOneOfOrAnyOfLeaf && leaf !== undefined) {
            plainLeafWasCleared = true;
          }
        }
      }

      if (plainLeafWasCleared) {
        setByPath(formData, path, undefined);
      } else {
        setByPath(formData, path, valueForPath);
      }
    }
    const shouldSanitize =
      current.retrievedSchema !== undefined &&
      !isRootPath &&
      !disabled &&
      !readonly &&
      // An object or array is otherwise written by a container, whose own fields raise the changes to its values
      (isObject(newValue) || Array.isArray(newValue)
        ? (schemaUtils: SchemaUtilsType<T, S, F>, retrievedSchema: S, changedData: T) =>
            isWholeValueSelectAt<T, S, F>(schemaUtils, retrievedSchema, path, changedData)
        : true);
    // Only the data and its context are derived here; the errors are reconciled below
    const derived = deriveFormData(current, inputForDefaults, { shouldSanitize }, props);
    formData = derived.formData;
    context = derived.context;

    // Re-set to undefined after merging defaults so the user's clear is preserved in
    // state (#5125 regression: without this, clearing a second field re-applies the
    // default to previously-cleared fields). The undefined key is stripped from the
    // formData copy passed to AJV via JSON.parse(JSON.stringify(...)) so the validator never
    // sees { [key]: undefined } for type:"string" or patternProperties fields (#4518).
    if (plainLeafWasCleared && formData) {
      // `replaceEqualDeep()` may have handed back subtrees of the committed data, and `setByPath()` writes through
      // every container along the path, so the clear lands on copies of just those containers
      formData = setByPath(copyAlongPath(formData, path), path, undefined);
    }
  }

  let newFormData = formData;

  if (omitExtraData === true && liveOmit === 'onChange') {
    newFormData = context.schemaUtils.omitExtraData(context.schema, formData);
  }

  // Live validation rewrites the validator's errors below, so only a form without it clears those of the replaced
  // values here. The data an item move leaves is diffed with the items where the move put them, so the errors that
  // moved with them stay
  const changed = isLiveValidated(props)
    ? []
    : changedPaths(
        newFormData,
        change.newIndexOf ? withItemsMoved(oldFormData, newFormData, path, change.newIndexOf) : oldFormData,
      );
  let next: Partial<FormState<T, S, F>> = {
    formData: newFormData,
    ...applyChangeToErrors(current, change, extraErrors, changed),
  };
  if (isLiveValidated(props)) {
    const liveValidation = runLiveValidation(props, context, newFormData, next.customErrors, context.retrievedSchema);
    next = { ...next, ...liveValidation };
  }
  return { ...current, ...context, ...next };
}

/** The state after `reset()`: the data is re-derived from the props' seed the way an initial render does it, every
 * error, including the custom ones fields raised, is cleared, and the render context the derivation resolved with is
 * committed alongside the data.
 *
 * @param current - The state being reset
 * @param props - The current props
 * @returns - The reset state, sharing every unchanged subtree with `current`
 */
export function applyReset<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  const { formData, context } = deriveFormData(current, seedOf(props), { isReset: true }, props);
  return {
    ...current,
    ...context,
    formData,
    errorSchema: {},
    errors: [],
    schemaValidationErrors: [],
    schemaValidationErrorSchema: {},
    // The reset pass has generated the initial defaults, so the next unrelated recompute is not an initial pass and
    // will not resurrect a `ui:initialValue` the user has since cleared
    initialDefaultsGenerated: true,
    customErrors: undefined,
  };
}

/** The state after a field is blurred: the data with extra data omitted when `liveOmit` is `'onBlur'`, validated when
 * `liveValidate` is. `current` itself when neither applies.
 *
 * @param current - The state at the blur
 * @param props - The current props
 * @returns - The next state, sharing every unchanged subtree with `current`
 */
export function applyBlur<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  const { omitExtraData, liveOmit } = props;
  const { schema, schemaUtils, customErrors, retrievedSchema } = current;
  const formData =
    omitExtraData === true && liveOmit === 'onBlur'
      ? schemaUtils.omitExtraData(schema, current.formData)
      : current.formData;
  const validation = isBlurValidated(props)
    ? runLiveValidation(props, current, formData, customErrors, retrievedSchema)
    : undefined;
  return { ...current, formData, ...validation };
}

/** Validates `formData` for a submission or `validateForm()`: whether the errors block, the merged errors to report,
 * and the state that displays them, which is `current` itself when the displayed errors do not change.
 *
 * @param current - The state being validated
 * @param props - The current props
 * @param formData - The data to validate
 * @returns - The blocking flag and the next state, which carries the errors to report
 */
export function applyValidation<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  props: FormProps<T, S, F>,
  formData: T | undefined,
): { hasError: boolean; next: FormState<T, S, F> } {
  const { extraErrors, extraErrorsAreWarnings } = props;
  const { errors: prevErrors, customErrors } = current;
  const schemaValidation = validateFormData(props, current, formData);
  // Always merge extraErrors/customErrors so they remain visible in state regardless of extraErrorsAreWarnings.
  const { errors, errorSchema } = mergeErrors(schemaValidation, extraErrors, customErrors);
  // extraErrors also block unless extraErrorsAreWarnings is set, in which case they are informational only.
  const hasBlockingExtraErrors = !extraErrorsAreWarnings && !!extraErrors && toErrorList(extraErrors).length > 0;
  // customErrors are raised imperatively by field/widget components (via onChange's errorSchema argument) and,
  // like schema errors, always block regardless of extraErrorsAreWarnings.
  const hasCustomErrors = !!customErrors && toErrorList(customErrors).length > 0;
  const hasError = schemaValidation.errors.length > 0 || hasBlockingExtraErrors || hasCustomErrors;
  let next = current;
  if (hasError) {
    next = {
      ...current,
      errors,
      errorSchema,
      schemaValidationErrors: schemaValidation.errors,
      schemaValidationErrorSchema: schemaValidation.errorSchema,
    };
  } else if (errors.length > 0 || prevErrors.length > 0) {
    // Either non-blocking `extraErrors` are on display without `onError` firing, or the errors that were on display
    // are gone; the validator's own results are empty for both
    next = { ...current, errors, errorSchema, schemaValidationErrors: [], schemaValidationErrorSchema: {} };
  }
  // Unlike the other `apply*` functions this one shares here rather than leaving it to `commit()`, because the caller
  // decides whether to commit at all by comparing the result to the state it started from
  return { hasError, next: replaceEqualDeep(current, next) };
}

/** The state after a valid submission: the submitted data, with `extraErrors` as the only errors on display
 *
 * @param current - The state at the submission
 * @param props - The current props
 * @param formData - The submitted data
 * @returns - The next state, sharing every unchanged subtree with `current`
 */
export function applySubmit<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  props: FormProps<T, S, F>,
  formData: T | undefined,
): FormState<T, S, F> {
  const { extraErrors } = props;
  return {
    ...current,
    formData,
    errors: extraErrors ? toErrorList(extraErrors) : [],
    errorSchema: extraErrors ?? {},
    schemaValidationErrors: [],
    schemaValidationErrorSchema: {},
  };
}

/** The data the props hand the form: `formData`, which the form takes whenever it is passed a value it did not hand
 * out, or else `initialFormData`, which it reads on mount and on `reset()` only. A `null` seeds the same defaults an
 * `undefined` does.
 *
 * @param props - The current props
 * @returns - The seed, or `undefined` when the props pass none
 */
export function seedOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
): T | undefined {
  return props.formData ?? props.initialFormData;
}

export function initialState<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  if (!props.validator) {
    throw new Error('A validator is required for Form functionality to work');
  }
  return { ...deriveDataState(undefined, seedOf(props), props), formDataProp: props.formData };
}

/** `state` recording the `formData` prop it was derived with, by identity, which `replaceEqualDeep()` would not keep
 * for a value equal to the one before it
 */
function withFormDataProp<T, S extends StrictRJSFSchema, F extends FormContextType>(
  state: FormState<T, S, F>,
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  return state.formDataProp === props.formData ? state : { ...state, formDataProp: props.formData };
}

/** Derives the state to render from the props and the committed `state`, so a `formData` is rendered the moment it
 * arrives, with no stale commit in between. Nothing is remembered about the previous props: every derived member is
 * shared against the committed state, so an unchanged input hands back the reference the fields already hold and a
 * changed one is recognized by the new reference; when nothing changed, `state` itself is handed back. The data is
 * re-derived for a `formData` the form did not hand out itself and for a schema, `ui:emptyValue` or
 * `defaultFormStateBehavior` change; any other prop change re-derives the render context alone, since an unrelated
 * re-render must not rerun value initialization.
 *
 * @param props - The current props
 * @param state - The committed state
 * @returns - The state to render, `state` itself when nothing changed
 */
export function deriveState<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  state: FormState<T, S, F>,
): FormState<T, S, F> {
  // A `formData` is taken as the form's value the way a controlled `<input>` takes a new `value`, unless the form has
  // seen it already: as its own data, which a parent storing what `onChange` reported passes back on every edit, or as
  // the prop of the render before, which a parent that has yet to render an edit, or stores none, passes again. The
  // data pass derives the render context for the new data itself
  if (props.formData !== undefined && props.formData !== state.formDataProp && props.formData !== state.formData) {
    return withFormDataProp(replaceEqualDeep(state, deriveDataState(state, props.formData, props, true)), props);
  }
  const context = deriveRenderContext(props, state.retrievedSchema, state, resolveSchemaUtils(props, state));
  const { isSchemaChanged, isValidationPropChanged } = detectContextChanges(state, context);
  // Rebuilt schema utilities are not on their own a reason to rerun value initialization: they are rebuilt for a
  // recreated `validator` or `customMergeAllOf` as well, which parents commonly write inline, and re-deriving there
  // replaces data the user cleared or switched away from with the very default it came from (#5294). Only the props
  // that decide what the data should be do: the schema, the uiSchema's `ui:emptyValue`s, and the settings that decide
  // how the defaults are computed
  const isEmptyValueChanged =
    context.uiSchema !== state.uiSchema && !deepEquals(emptyValuesOf(context.uiSchema), emptyValuesOf(state.uiSchema));
  if (isSchemaChanged || isEmptyValueChanged || context.defaultsBehavior !== state.defaultsBehavior) {
    return withFormDataProp(replaceEqualDeep(state, deriveDataState(state, state.formData, props)), props);
  }
  // Resolved only once it is known the data is not re-derived, which resolves it itself
  const resolvedContext = {
    ...context,
    retrievedSchema: resolveRetrievedSchema(state, context.schemaUtils, state.formData),
  };
  const errors = reconcileErrors(state, props, resolvedContext, state.formData, {
    mustValidate: mustLiveValidate(props, state.edit, isValidationPropChanged),
    validationSchema: context.schemaUtils === state.schemaUtils ? resolvedContext.retrievedSchema : undefined,
  });
  return withFormDataProp(replaceEqualDeep(state, { ...state, ...resolvedContext, ...errors }), props);
}
