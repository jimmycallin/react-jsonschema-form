import type { CyclicSchemaExpandProps, FormContextType, RJSFSchema } from '@rjsf/utils';
import { ID_KEY, TranslatableString } from '@rjsf/utils';
import { Alert, Button, Space } from 'antd';

/** The `CyclicSchemaExpandTemplate` is the template to use to render the cyclic schema expand message and controls
 *
 * @param props - The `CyclicSchemaExpandProps` for this component
 */
export default function CyclicSchemaExpandTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: CyclicSchemaExpandProps<T, S, F>) {
  const { name, fieldPathId, registry, onExpand } = props;
  const { translateString } = registry;
  const buttonId = `${fieldPathId[ID_KEY]}-button`;

  return (
    <Alert
      type='warning'
      title={translateString(TranslatableString.CycleDetected, [name])}
      action={
        <Space>
          <Button id={buttonId} size='small' type='default' onClick={() => onExpand(fieldPathId[ID_KEY])}>
            {translateString(TranslatableString.ExpandButton)}
          </Button>
        </Space>
      }
    />
  );
}
