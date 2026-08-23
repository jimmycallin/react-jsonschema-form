import { Button } from '@chakra-ui/react';
import type { FormContextType, IconButtonProps, RJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import { PlusIcon } from 'lucide-react';

export default function AddButton<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ registry, ...props }: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <Button {...props}>
      <PlusIcon />
      {translateString(TranslatableString.AddItemButton)}
    </Button>
  );
}
