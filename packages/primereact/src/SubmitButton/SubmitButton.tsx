import type { FormContextType, RJSFSchema, SubmitButtonProps } from '@rjsf/utils';
import { getSubmitButtonOptions } from '@rjsf/utils';
import { Button } from 'primereact/button';

/** The `SubmitButton` renders a button that represents the `Submit` action on a form
 */
export default function SubmitButton<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ uiSchema }: SubmitButtonProps<T, S, F>) {
  const { submitText, norender, props: submitButtonProps = {} } = getSubmitButtonOptions<T, S, F>(uiSchema);
  if (norender) {
    return null;
  }
  return <Button type='submit' label={submitText} {...submitButtonProps} />;
}
