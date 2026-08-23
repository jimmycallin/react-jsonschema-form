import { Box, Button } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, SubmitButtonProps } from '@rjsf/utils';
import { getSubmitButtonOptions } from '@rjsf/utils';

export default function SubmitButton<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ uiSchema }: SubmitButtonProps<T, S, F>) {
  const { submitText, norender, props: submitButtonProps } = getSubmitButtonOptions(uiSchema);
  if (norender) {
    return null;
  }

  return (
    <Box marginTop={3}>
      <Button type='submit' variant='solid' {...submitButtonProps}>
        {submitText}
      </Button>
    </Box>
  );
}
