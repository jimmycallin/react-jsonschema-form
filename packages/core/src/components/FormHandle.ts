import type { FieldPathList, RJSFValidationError, ValidationData } from '@rjsf/utils';

import type { EventFormData } from './IChangeEvent.ts';

/** The imperative surface a `Form` exposes through its `ref`. It is the supported alternative to holding a ref to the
 * `Form` class instance, whose `state` and lifecycle are internals rather than API. A `Form` will be either
 * parent-owned (a `formData` prop, accepted through `onChange`) or self-owned (seeded by `initialFormData`); this
 * handle is the same for both, and it is the contract a later function-component `Form` keeps.
 *
 * Only the members listed here are supported. Everything else on the class instance may change without notice.
 */
export interface FormHandle<T = unknown> {
  /** Returns the form data the `Form` currently renders: the `formData` prop of a parent-owned form, the committed
   * data of a self-owned one. It is the read path for a self-owned form, whose data is not otherwise reachable between
   * `onChange` calls (autosave, route guards, a submit button outside the form).
   *
   * It reads committed data only: an edit or `setFieldValue()` in the same tick is not visible until React commits it,
   * and for a parent-owned form a proposal is not visible until the parent has passed it back. Treat the result as
   * read-only: mutating it mutates what the form renders.
   */
  getFormData(): EventFormData<T>;
  /** Programmatically submits the `Form`, running validation and `onSubmit`/`onError` as a submit button would, on the
   * data it is given, or, when none is, on the data the form holds once the edits, `setFieldValue()` calls and resets
   * in flight have run: it is queued behind them. Data it is given is never installed: a self-owned form keeps what it
   * holds, a parent-owned form renders what its parent passes, and nothing is proposed. A submit of the data the form
   * holds keeps, as it always has, the copy without the extra data `omitExtraData` drops. The submit goes through the
   * DOM, so a `tagName` other than `form` cannot submit. Without data, HTML5 validation runs unless `noHtml5Validate`;
   * with data it doesn't, since it checks the inputs on screen rather than the data given, which the form's own
   * validation checks. Passing `undefined` is the same as passing nothing.
   *
   * @param [formData] - The data to submit in place of the data the form holds
   */
  submit(formData?: T): void;
  /** Clears the validation errors and, for a self-owned form, resets the data to `initialFormData` and the schema's
   * defaults; a parent-owned form's data is the parent's to reset. Queued behind any operation in flight.
   */
  reset(): void;
  /** Sets the value of the field at `fieldPath`, either a dotted path or a `FieldPathList`. Use `''` or `[]` for the
   * root. Passing `undefined` clears the field. A function is an updater, called with the field's current value when
   * the queued change runs, the way a field's `onChange` treats one.
   */
  setFieldValue(fieldPath: string | FieldPathList, newValue?: unknown): void;
  /** Validates the given `formData`, or the committed data when none is given, filtering extra data first when
   * `omitExtraData` is set, and calls `onError` as a submission would. It returns its answer at once, so without an
   * argument it reads committed data like `getFormData()`: an edit or `setFieldValue()` made in the same tick is
   * validated by passing its value. The data is never installed. Passing `undefined` is the same as passing nothing.
   *
   * @param [formData] - The data to validate in place of the committed data
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
   */
  validate(formData: T | undefined): ValidationData<T>;
  /** Moves focus to the field the given error belongs to */
  focusOnError(error: RJSFValidationError): void;
}
