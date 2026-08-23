import type { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema } from '@rjsf/utils';

export default function MultiSchemaFieldTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: MultiSchemaFieldTemplateProps<T, S, F>) {
  const { optionSchemaField, selector } = props;
  return (
    <div className='p-4 border rounded-sm shadow-sm'>
      <div className='mb-4'>{selector}</div>
      {optionSchemaField}
    </div>
  );
}
