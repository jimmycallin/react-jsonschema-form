import type { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema } from '@rjsf/utils';
import { Fieldset } from 'primereact/fieldset';

export default function MultiSchemaFieldTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: MultiSchemaFieldTemplateProps<T, S, F>) {
  const { selector, optionSchemaField } = props;

  return (
    <Fieldset>
      <div style={{ marginBottom: '1rem' }}>{selector}</div>
      {optionSchemaField}
    </Fieldset>
  );
}
