import type { FormContextType, RJSFSchema, SubmitButtonProps } from '@rjsf/utils';
import { getSubmitButtonOptions } from '@rjsf/utils';
import Button from 'react-bootstrap/Button';

export default function SubmitButton<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: SubmitButtonProps<T, S, F>) {
  const { submitText, norender, props: submitButtonProps } = getSubmitButtonOptions<T, S, F>(props.uiSchema);
  if (norender) {
    return null;
  }
  return (
    <div>
      <Button variant='primary' type='submit' {...submitButtonProps}>
        {submitText}
      </Button>
    </div>
  );
}
