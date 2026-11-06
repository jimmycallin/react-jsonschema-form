'use client';

import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';
import type { ChoiceWidgetLabelOptions, ChoiceWidgetOption, ChoiceWidgetProps } from './useChoiceWidgetProps.ts';
import useChoiceWidgetProps from './useChoiceWidgetProps.ts';

/** One checkbox of a group, ready to hand to its control */
export interface CheckboxesWidgetOption extends ChoiceWidgetOption {
  /** Checks or unchecks the option and reports the group's new selection to `onChange` */
  onCheckedChange: (checked: boolean) => void;
}

export interface UseCheckboxesWidgetPropsResult extends Omit<ChoiceWidgetProps, 'options'> {
  /** Every checkbox, in enum order */
  options: CheckboxesWidgetOption[];
  /** The encoded values of the checked options, in enum order */
  value: string[];
  /** Decodes the encoded values of the options the group checked into form data, in enum order, and reports it to
   * `onChange`. A missing value is no choice
   */
  onChange: (value: string[] | null | undefined) => void;
}

/** Hook which holds what every `CheckboxesWidget` does whatever its UI library: it encodes each option's value as
 * `ui:optionValueFormat` asks, marks the checked options and the `ui:enumDisabled` ones, picks the option
 * `ui:autofocus` focuses, decodes a selection back into form data in enum order, and supplies the group's and its
 * checkboxes' ids, name and `aria-*` attributes. Each option's focus and blur handlers report that option's value. The
 * handlers report nothing while the field is disabled or read-only. To be used by theme specific `CheckboxesWidget`
 * implementations, and by an app's own.
 *
 * @param props - The `WidgetProps` for the `CheckboxesWidget`
 * @param [labelOptions] - Whether the widget draws the field's label for its group itself
 * @returns - The `UseCheckboxesWidgetPropsResult` to be used within a `CheckboxesWidget` implementation
 */
export default function useCheckboxesWidgetProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>, labelOptions: ChoiceWidgetLabelOptions = {}): UseCheckboxesWidgetPropsResult {
  const { common, held, onChange } = useChoiceWidgetProps<T, S, F>(props, 'group', labelOptions);
  return {
    ...common,
    options: common.options.map((option) => ({
      ...option,
      onCheckedChange: (checked: boolean) =>
        onChange(checked ? [...held, option.value] : held.filter((value) => value !== option.value)),
    })),
    value: held,
    onChange,
  };
}
