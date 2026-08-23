import type { CyclicSchemaExpandProps, FormContextType, RJSFSchema } from '@rjsf/utils';
import { ID_KEY, TranslatableString } from '@rjsf/utils';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

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
    <div style={{ marginTop: '1rem' }}>
      <Message
        severity='warn'
        text={translateString(TranslatableString.CycleDetected, [name])}
        style={{ width: '100%', justifyContent: 'start', marginBottom: '0.5rem' }}
      />
      <Button
        id={buttonId}
        type='button'
        severity='warning'
        size='small'
        outlined
        label={translateString(TranslatableString.ExpandButton)}
        onClick={() => onExpand(fieldPathId[ID_KEY])}
      />
    </div>
  );
}
