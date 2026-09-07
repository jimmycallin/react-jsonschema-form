import { RichHelp } from '@rjsf/core';
import type { FieldHelpProps, FormContextType, RJSFSchema } from '@rjsf/utils';
import { helpId } from '@rjsf/utils';
import Form from 'react-bootstrap/Form';

/** The `FieldHelpTemplate` component renders any help desired for a field
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
export default function FieldHelpTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldHelpProps<T, S, F>) {
  const { fieldPathId, help, uiSchema, registry, hasErrors } = props;
  if (!help) {
    return null;
  }
  return (
    <Form.Text id={helpId(fieldPathId)} className={hasErrors ? 'text-danger' : 'text-muted'}>
      <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
    </Form.Text>
  );
}
