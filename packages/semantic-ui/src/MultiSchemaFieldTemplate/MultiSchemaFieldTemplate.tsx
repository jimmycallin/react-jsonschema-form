import type { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema } from '@rjsf/utils';

export default function MultiSchemaFieldTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: MultiSchemaFieldTemplateProps<T, S, F>) {
  const { selector, optionSchemaField } = props;

  return (
    <div>
      <div>{selector}</div>
      {optionSchemaField}
    </div>
  );
}
