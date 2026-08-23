import type { FormContextType, IconButtonProps, RJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';

import { Plus } from '../icons';
import IconButton from './IconButton';

/** The `AddButton` renders a button that represent the `Add` action on a form
 */
export default function AddButton<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: IconButtonProps<T, S, F>) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton title={translateString(TranslatableString.AddItemButton)} variant='subtle' {...props} icon={<Plus />} />
  );
}
