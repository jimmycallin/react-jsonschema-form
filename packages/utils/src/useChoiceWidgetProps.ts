'use client';

import enumOptionsAutofocusIndex from './enumOptionsAutofocusIndex.ts';
import type { GroupRole } from './getGroupAttributes.ts';
import getGroupAttributes from './getGroupAttributes.ts';
import getLabelId from './getLabelId.ts';
import { optionId } from './idGenerators.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';
import useOptionFocusHandlers from './useOptionFocusHandlers.ts';
import type { SelectWidgetOption } from './useSelectWidgetProps.ts';
import useSelectWidgetProps from './useSelectWidgetProps.ts';
import widgetDrawsLabelText from './widgetDrawsLabelText.ts';

function reportNothing() {}

/** One option of a radio group or a group of checkboxes, ready to hand to its control */
export interface ChoiceWidgetOption extends SelectWidgetOption {
  /** The id of the option's control */
  id: string;
  /** Whether the option is chosen */
  checked: boolean;
  /** Whether the option's control takes focus when it mounts, which at most one option's does */
  autoFocus: boolean;
  /** Reports the option's value to `onFocus`. It takes no argument, so it can be handed to any control's focus event */
  onFocus: () => void;
  /** Reports the option's value to `onBlur`. It takes no argument, so it can be handed to any control's blur event */
  onBlur: () => void;
}

/** How the widget calling a choice widget hook labels its group */
export interface ChoiceWidgetLabelOptions {
  /** Whether the widget draws the field's label for its group itself, rather than leaving it to its template. The
   * label is drawn only where `drawsLabel` comes back `true`, and the group is pointed at it there
   */
  drawsLabel?: boolean;
}

/** What a radio group and a group of checkboxes share */
export interface ChoiceWidgetProps {
  /** The group's id */
  id: string;
  /** The name of the options' controls, for a native form submission */
  name: string;
  /** Whether the field is required */
  required: boolean | undefined;
  /** Whether the group is disabled, which it is when the field is disabled or read-only */
  disabled: boolean;
  /** Whether `ui:options.inline` lays the options out in a row */
  inline: boolean;
  /** Every option, in enum order. An option's `disabled` is `ui:enumDisabled`'s alone, apart from the group's */
  options: ChoiceWidgetOption[];
  /** The `role` and `aria-*` attributes of the element wrapping the options */
  groupProps: ReturnType<typeof getGroupAttributes>['group'];
  /** The `aria-*` attributes of each option's control */
  optionProps: ReturnType<typeof getGroupAttributes>['option'];
  /** Whether the widget is to draw the field's label, which it is only where it asked to and the field shows one */
  drawsLabel: boolean;
  /** The id to draw the field's label under */
  labelId: string;
}

/** The shared body of `useRadioWidgetProps()` and `useCheckboxesWidgetProps()`: a radio group is a single select and a
 * group of checkboxes a multiple one, drawn with a control per option, so each is built on `useSelectWidgetProps()`
 */
export default function useChoiceWidgetProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>, role: GroupRole, { drawsLabel: drawsOwnLabel = false }: ChoiceWidgetLabelOptions) {
  const multiple = role === 'group';
  const select = useSelectWidgetProps<T, S, F>({ ...props, multiple });
  const { id, options, onFocus, onBlur, autofocus } = props;
  const { enumOptions, enumDisabled, inline = false } = options;
  const { focusHandlers, blurHandlers } = useOptionFocusHandlers<T, S, F>({
    id,
    options,
    onFocus: select.disabled ? reportNothing : onFocus,
    onBlur: select.disabled ? reportNothing : onBlur,
  });
  const held = [select.value].flat();
  // A radio group focuses its checked option, where Tab into the group lands
  const autofocusIndex = enumOptionsAutofocusIndex<S>(
    enumOptions,
    enumDisabled,
    autofocus,
    multiple ? undefined : props.value,
  );
  const labelId = getLabelId<T, S, F>(props);
  const drawsLabel = drawsOwnLabel && widgetDrawsLabelText<T, S, F>(props);
  const { group, option } = getGroupAttributes<T, S, F>(props, role, drawsLabel ? labelId : undefined);

  const common: ChoiceWidgetProps = {
    id,
    name: select.name,
    required: select.required,
    disabled: select.disabled,
    inline,
    options: select.options.map((choice) => ({
      ...choice,
      id: optionId(id, choice.index),
      checked: held.includes(choice.value),
      autoFocus: choice.index === autofocusIndex,
      onFocus: focusHandlers[choice.index],
      onBlur: blurHandlers[choice.index],
    })),
    groupProps: group,
    optionProps: option,
    drawsLabel,
    labelId,
  };
  return { common, held, onChange: select.onChange };
}
