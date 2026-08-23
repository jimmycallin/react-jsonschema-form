import { RichHelp } from '@rjsf/core';
import type { FieldHelpProps, FormContextType, RJSFSchema } from '@rjsf/utils';
import { helpId } from '@rjsf/utils';
import { Message } from 'semantic-ui-react';

/** The `FieldHelpTemplate` component renders any help desired for a field
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
export default function FieldHelpTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldHelpProps<T, S, F>) {
  const { fieldPathId, help, uiSchema, registry } = props;
  if (help) {
    return (
      <Message size='mini' info id={helpId(fieldPathId)}>
        <RichHelp help={help} registry={registry} uiSchema={uiSchema} />
      </Message>
    );
  }
  return null;
}
