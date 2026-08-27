import type { CyclicSchemaExpandProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

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
        onClick={() => onExpand(id)}
      />
    </div>
  );
}
