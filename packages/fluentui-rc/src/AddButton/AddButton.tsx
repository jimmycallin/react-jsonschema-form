import { Button } from '@fluentui/react-components';
import { AddRegular } from '@fluentui/react-icons';
import type { FormContextType, IconButtonProps, RJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';

export default function AddButton<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ uiSchema, registry, ...props }: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return <Button title={translateString(TranslatableString.AddItemButton)} {...props} icon={<AddRegular />} />;
}
