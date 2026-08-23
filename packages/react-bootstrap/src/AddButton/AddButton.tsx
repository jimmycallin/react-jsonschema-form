import { BsPlus } from '@react-icons/all-files/bs/BsPlus';
import type { FormContextType, IconButtonProps, RJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import Button from 'react-bootstrap/Button';

export default function AddButton<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ uiSchema, registry, ...props }: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <Button
      title={translateString(TranslatableString.AddItemButton)}
      {...props}
      style={{ width: '100%' }}
      className={`ml-1 ${props.className}`}
    >
      <BsPlus />
    </Button>
  );
}
