import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';

import DateTimeInput from './DateTimeInput';

/** The `DateTimeWidget` component uses the `DateTimeInput` changing the valueFormat to show `datetime`
 *
 * @param props - The `WidgetProps` for this component
 */
export default function DateTimeWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  return <DateTimeInput {...props} defaultValueFormat='YYYY-MM-DD HH:mm:ss' />;
}
