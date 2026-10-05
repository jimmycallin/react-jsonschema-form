import type { FieldPathList, RJSFValidationError, ValidationData } from '@rjsf/utils';

import type { EventFormData } from './IChangeEvent.ts';

/** The supported imperative surface exposed by function Form. Self-owned operations read current model data;
 * parent-owned operations read committed props and propose edits. The model is configured in a layout Effect,
 * so descendant layout Effects and callback refs can still reach previous parent data/configuration.
 * Use events or passive Effects for commands that depend on new props.
 */
export interface FormHandle<T = unknown> {
  /** Returns current model data for a self-owned form, including completed same-tick writes, or committed
   * parent data for a parent-owned form. Treat it as read-only; model data can be newer than the DOM.
   */
  getFormData(): EventFormData<T>;
  /** Submits current owner data through the DOM, with schema validation. When self-owned data is newer than
   * the inputs, native constraint validation is skipped because it would check a different value.
   */
  submit(): void;
  /** Clears the validation errors and, for a self-owned form, resets the data to `initialFormData` and the schema's
   * defaults; a parent-owned form's data is the parent's to reset.
   */
  reset(): void;
  /** Sets the value of the field at `fieldPath`, either a dotted path or a `FieldPathList`. Use `''` or `[]` for the
   * root. Passing `undefined` clears the field.
   */
  setFieldValue(fieldPath: string | FieldPathList, newValue?: unknown): void;
  /** Validates current owner data, filtering extra data when omitExtraData is set, reporting onError and
   * returning its result immediately. Self-owned validation sees completed same-tick writes; controlled
   * proposals must be accepted before they become current. To validate a proposal use validateFormWithFormData().
   */
  validateForm(): boolean;
  /** Validates the given `formData` without making it the form's data, calling `onError` as a submission would.
   *
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
