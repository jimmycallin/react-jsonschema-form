import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';

import DateTimeInput from './DateTimeInput';

/** The `DateWidget` component uses the `DateTimeInput` changing the valueFormat to show `date`
 *
 * @param props - The `WidgetProps` for this component
 */
export default function DateWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  return <DateTimeInput {...props} defaultValueFormat='YYYY-MM-DD' />;
}
