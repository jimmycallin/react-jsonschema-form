import type { CyclicSchemaExpandProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import { Alert, Button, Space, version } from 'antd';

const antdMajor = parseInt(version.split('.')[0], 10);

/** The `CyclicSchemaExpandTemplate` is the template to use to render the cyclic schema expand message and controls
 *
 * @param props - The `CyclicSchemaExpandProps` for this component
 */
export default function CyclicSchemaExpandTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: CyclicSchemaExpandProps<T, S, F>) {
  const { name, id, registry, onExpand } = props;
  const { translateString } = registry;
  const buttonId = `${id}-button`;

  const headerProp =
    antdMajor >= 6
      ? { title: translateString(TranslatableString.CycleDetected, [name]) }
      : { message: translateString(TranslatableString.CycleDetected, [name]) };

  return (
    <Alert
      type='warning'
      {...headerProp}
      action={
        <Space>
          <Button id={buttonId} size='small' type='default' onClick={() => onExpand(id)}>
            {translateString(TranslatableString.ExpandButton)}
          </Button>
        </Space>
      }
    />
  );
}
