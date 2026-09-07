import { useCallback } from 'react';
import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import { getTemplate } from '@rjsf/utils';

/** The `DateWidget` component uses the `BaseInputTemplate` changing the type to `date` and transforms
 * the value to undefined when it is falsy during the `onChange` handling.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function DateWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { onChange, options, registry } = props;
  const BaseInputTemplate = getTemplate<'BaseInputTemplate', T, S, F>('BaseInputTemplate', registry, options);
  const handleChange = useCallback((value?: string) => onChange(value || undefined), [onChange]);

  return <BaseInputTemplate type='date' {...props} onChange={handleChange} />;
}
