import { Text } from '@mantine/core';
import { RichDescription } from '@rjsf/core';
import type { DescriptionFieldProps, FormContextType, RJSFSchema } from '@rjsf/utils';

/** The `DescriptionField` is the template to use to render the description of a field
 *
 * @param props - The `DescriptionFieldProps` for this component
 */
export default function DescriptionField<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: DescriptionFieldProps<T, S, F>) {
  const { id, description, registry, uiSchema } = props;
  if (description) {
    return (
      <Text id={id} mt={3} mb='sm'>
        <RichDescription description={description} registry={registry} uiSchema={uiSchema} />
      </Text>
    );
  }

  return null;
}
