import type {
  ErrorSchema,
  FormContextType,
  RJSFSchema,
  RJSFValidationError,
  SchemaUtilsType,
  StrictRJSFSchema,
  UiSchema,
} from '@rjsf/utils';

/** The form data a change, a submit or `FormHandle.getFormData()` hands back. No change below an object or array root
 * replaces it with `undefined` (the change writes into it, and defaults are computed from an object), so its type is
 * `T` itself; a scalar root is `undefined` whenever its field is cleared. A write at the root itself can still leave an
 * object or array root `undefined`, which this type does not reflect: `setFieldValue('', undefined)`, or a root-level
 * custom field or widget calling `onChange(undefined, ROOT_FIELD_PATH)`. So can a blur's `applyTo(undefined)`, which
 * hands `base` back as it is.
 */
export type EventFormData<T> = T extends object ? T : T | undefined;

/** The event handed to `onChange` and `onSubmit`. It is declared on its own rather than as a `Pick` of `FormState`
 * because it is the public contract while `FormState` is an implementation detail: the state's layout is free to change
 * as long as `toIChangeEvent()` in `Form.tsx`, the only place an event is built, still produces this shape.
 *
 * Every member is `readonly`. The event's `formData` shares its unchanged subtrees with the value the change was
 * applied to, which for a parent-owned form is the parent's own object, so writing into the event writes into that
 * data. Copy what you need out of the event instead.
 */
export interface IChangeEvent<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The JSON schema object for the form */
  readonly schema: S;
  /** The uiSchema for the form */
  readonly uiSchema: UiSchema<T, S, F>;
  /** The schemaUtils implementation used by the `Form`, created from the `validator` and the `schema` */
  readonly schemaUtils: SchemaUtilsType<T, S, F>;
  /** The current data for the form: this event's proposal applied to the data the form rendered, `applyTo` of it */
  readonly formData: EventFormData<T>;
  /** This event's proposal applied to `base`: what `formData` is to the rendered data, `applyTo(base)` is to any
   * value. For a change it sets the field's value, an updater resolved against `base`, at its path and applies
   * defaults, sanitization and `liveOmit: 'onChange'` omission; for a blur under `liveOmit: 'onBlur'` it omits extra
   * data from `base`; for a reset or a submit it hands back that event's data whatever `base` is. It depends only on
   * `base` and what the form rendered and was given when the event was made, and does not validate, so a parent may hand it straight to React, `setData(event.applyTo)`, and proposals made in one tick
   * then compose in the parent's own update queue, each applied to the previous one's result, exactly as two
   * `setState()` updaters do. A parent that stores `formData` instead keeps the last proposal, as a controlled
   * `<input>` would. It settles `base` against the schema resolved for the rendered data, so a `base` that resolves
   * to a different `if`/`then`/`else` branch or `oneOf` option is sanitized as though it moved from the rendered
   * data's branch.
   *
   * Declared as a method type, which TypeScript checks bivariantly, so the event of a typed form stays assignable to
   * the default `IChangeEvent` and a handler written against the default still fits a typed form; a function-typed
   * property would be checked contravariantly on `base` and break that.
   */
  readonly applyTo: { bivarianceHack(base: T | undefined): EventFormData<T> }['bivarianceHack'];
  /** The current list of errors for the form, includes `extraErrors` */
  readonly errors: RJSFValidationError[];
  /** The current errors, in `ErrorSchema` format, for the form, includes `extraErrors` */
  readonly errorSchema: ErrorSchema<T>;
  /** The status of the form when submitted */
  readonly status?: 'submitted';
}
