import { Stack } from '@mantine/core';
import type { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema } from '@rjsf/utils';

export default function MultiSchemaFieldTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ selector, optionSchemaField }: MultiSchemaFieldTemplateProps<T, S, F>) {
  return (
    <Stack style={{ marginBottom: '1rem' }}>
      {selector}
      {optionSchemaField}
    </Stack>
  );
}
