import type { FieldPathList, RJSFValidationError, ValidationData } from '@rjsf/utils';

import type { EventFormData } from './IChangeEvent.ts';

/** The imperative surface a `Form` exposes through its `ref`. A `Form` will be either parent-owned (a `formData`
 * prop, accepted through `onChange`) or self-owned (seeded by `initialFormData`); this handle is the same for both.
 *
 * Every member acts on the data the form renders, the state of the last commit, or on the data it is given. Nothing
 * waits for a commit: an edit and a read, or two edits, made in the same tick each see the render they were made
 * from, as two changes to a controlled `<input>` would. The members fall into three kinds that never mix: writes
 * (`setFieldValue()`, `reset()`), reads (`getFormData()`) and actions (`validateForm()`, `submit()`), and an action
 * never writes. A sequence that needs fresher data than the render is spelled with the data-taking forms: one root
 * replacement instead of several `setFieldValue()` calls, then `submit(data)` or `validateForm(data)` with that same
 * value.
 */
export interface FormHandle<T = unknown> {
  /** Returns the form data the `Form` currently renders: the `formData` prop of a parent-owned form, the committed
   * data of a self-owned one. It is the read path for a self-owned form, whose data is not otherwise reachable between
   * `onChange` calls (autosave, route guards, a submit button outside the form).
   *
   * It reads the render only: an edit or `setFieldValue()` in the same tick is not visible until React commits it,
   * which is also why it returns the previous value inside `onChange`, where `event.formData` is the edit; and for a
   * parent-owned form a proposal is not visible until the parent has passed it back. Treat the result as read-only:
   * mutating it mutates what the form renders.
   */
  getFormData(): EventFormData<T>;
  /** Programmatically submits the `Form`, running validation and `onSubmit`/`onError` as a submit button would, on the
   * data it is given, or on the rendered data when none is: an edit made in the same tick is not yet rendered, so
   * `setFieldValue([], next)` followed by `submit(next)` is how a set-and-submit is spelled. The data is never
   * installed: a self-owned form keeps what it holds, a parent-owned form renders what its parent passes, and nothing
   * is proposed. The submit goes through the DOM, so HTML5 validation runs unless `noHtml5Validate` and a `tagName`
   * other than `form` cannot submit. Passing `undefined` is the same as passing nothing.
   *
   * @param [formData] - The data to submit in place of the rendered data
   */
  submit(formData?: T): void;
  /** Clears the validation errors and, for a self-owned form, resets the data to `initialFormData` and the schema's
   * defaults, reporting the result through `onChange`; a parent-owned form's data is the parent's to reset.
   */
  reset(): void;
  /** Sets the value of the field at `fieldPath`, either a dotted path or a `FieldPathList`, computed from the rendered
   * data and reported through `onChange`: a self-owned form commits it, a parent-owned form proposes it. Use `''` or
   * `[]` for the root, which replaces the whole value and is how several fields are written at once. Passing
   * `undefined` clears the field. Two calls in the same tick each report their own change applied to the rendered
   * data; a self-owned form still commits both, a parent-owned form's parent keeps the proposal it stores last.
   */
  setFieldValue(fieldPath: string | FieldPathList, newValue?: unknown): void;
  /** Validates the given `formData`, or the rendered data when none is given, filtering extra data first when
   * `omitExtraData` is set, and calls `onError` as a submission would. It returns its answer at once and reads the
   * render like `getFormData()`: an edit made in the same tick is validated by passing its value. The data is never
   * installed. The errors it commits describe the data it validated and show once the form renders that data, so a
   * parent-owned form that wants a draft's errors shown sets its state to the draft as well. Passing `undefined` is
   * the same as passing nothing.
   *
   * @param [formData] - The data to validate in place of the rendered data
   * @returns - True if the form is valid, false otherwise.
   */
  validateForm(formData?: T): boolean;
  /** Validates the given `formData` as it is, without omitting extra data, calling `onError` as a submission would.
   *
   * @deprecated Use `validateForm(formData)`, which omits extra data when `omitExtraData` is set like a submit does
   * @returns - True if the form is valid, false otherwise.
   */
  validateFormWithFormData(formData?: T): boolean;
  /** Runs the validator over `formData` against the form's schema and returns the raw errors without touching form
   * state
   *
   * @deprecated Stateless: build the utilities with `createSchemaUtils(validator, schema)` and validate with them
   */
  validate(formData: T | undefined): ValidationData<T>;
  /** Moves focus to the field the given error belongs to */
  focusOnError(error: RJSFValidationError): void;
}
