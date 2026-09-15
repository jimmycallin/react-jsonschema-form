import type { FormContextType, RJSFSchema, UnsupportedFieldProps } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';

import RichDescription from '../RichDescription.tsx';

/** The `UnsupportedField` component is used to render a field in the schema is one that is not supported by
 * react-jsonschema-form.
 *
 * @param props - The `FieldProps` for this template
 */
function UnsupportedField<T = unknown, S extends RJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: UnsupportedFieldProps<T, S, F>,
) {
  const { schema, uiSchema, fieldPathId, reason, registry } = props;
  const { translateString } = registry;
  let translateEnum: TranslatableString = TranslatableString.UnsupportedField;
  const translateParams: string[] = [];
  if (fieldPathId?.$id) {
    translateEnum = TranslatableString.UnsupportedFieldWithId;
    translateParams.push(fieldPathId.$id);
  }
  if (reason) {
    translateEnum =
      translateEnum === TranslatableString.UnsupportedField
        ? TranslatableString.UnsupportedFieldWithReason
        : TranslatableString.UnsupportedFieldWithIdAndReason;
    translateParams.push(reason);
  }
  return (
    <div className='unsupported-field'>
      <p>
        <RichDescription
          description={translateString(translateEnum, translateParams)}
          registry={registry}
          uiSchema={uiSchema}
        />
      </p>
      {schema && <pre>{JSON.stringify(schema, null, 2)}</pre>}
    </div>
  );
}

export default UnsupportedField;
