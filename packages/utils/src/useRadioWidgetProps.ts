'use client';

import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';
import type { ChoiceWidgetLabelOptions, ChoiceWidgetProps } from './useChoiceWidgetProps.ts';
import useChoiceWidgetProps from './useChoiceWidgetProps.ts';

export interface UseRadioWidgetPropsResult extends ChoiceWidgetProps {
  /** The encoded value of the checked option, or `''` when no option is checked */
  value: string;
  /** Decodes the encoded value of the option the group checked into form data and reports it to `onChange`. A missing
   * value is no choice, which reports `ui:emptyValue`
   */
  onChange: (value: string | null | undefined) => void;
}

/** Hook which holds what every `RadioWidget` does whatever its UI library: it encodes each option's value as
 * `ui:optionValueFormat` asks, marks the checked option and the `ui:enumDisabled` ones, picks the option `ui:autofocus`
 * focuses, decodes a choice back into form data, and supplies the group's and its radios' ids, name and `aria-*`
 * attributes. Each option's focus and blur handlers report that option's value. The handlers report nothing while the
 * field is disabled or read-only. To be used by theme specific `RadioWidget` implementations, and by an app's own.
 *
 * @param props - The `WidgetProps` for the `RadioWidget`
 * @param [labelOptions] - Whether the widget draws the field's label for its group itself
 * @returns - The `UseRadioWidgetPropsResult` to be used within a `RadioWidget` implementation
 */
export default function useRadioWidgetProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>, labelOptions: ChoiceWidgetLabelOptions = {}): UseRadioWidgetPropsResult {
  const { common, held, onChange } = useChoiceWidgetProps<T, S, F>(props, 'radiogroup', labelOptions);
  // A single select's value is one string, `''` with no option checked, so `held` holds exactly it
  return { ...common, value: held[0], onChange };
}
