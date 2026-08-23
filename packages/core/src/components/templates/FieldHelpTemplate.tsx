import type { FieldHelpProps, FormContextType, RJSFSchema } from '@rjsf/utils';
import { helpId } from '@rjsf/utils';

import RichHelp from '../RichHelp';

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
  if (!help) {
    return null;
  }

  return (
    <div id={helpId(fieldPathId)} className='help-block'>
      <RichHelp help={help as string} registry={registry} uiSchema={uiSchema} />
    </div>
  );
}
