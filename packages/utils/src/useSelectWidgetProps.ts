'use client';

import { useCallback, useMemo } from 'react';

import enumOptionsDomValues from './enumOptionsDomValues.ts';
import enumOptionSelectedValue from './enumOptionSelectedValue.ts';
import enumOptionValueDecoder from './enumOptionValueDecoder.ts';
import getOptionValueFormat from './getOptionValueFormat.ts';
import groupEnumOptions from './groupEnumOptions.ts';
import isEnumOptionsGroup from './isEnumOptionsGroup.ts';
import logUnsupportedDefaultForEnum from './logUnsupportedDefaultForEnum.ts';
import type { SelectedOptionDescriptionProps } from './SelectedOptionDescription.tsx';
import type {
  ControlAttributes,
  FormContextType,
  IndexedEnumOptionType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from './types.ts';
import useSelectFocusHandlers from './useSelectFocusHandlers.ts';
import widgetAriaProps from './widgetAriaProps.ts';
import widgetDrawsLabel from './widgetDrawsLabel.ts';

/** One option of a select, ready to hand to a select control */
export interface SelectWidgetOption {
  /** The option's encoded value, which no other option shares, for the control to select it by */
  value: string;
  /** The option's label */
  label: string;
  /** Whether `ui:enumDisabled` disables the option */
  disabled: boolean;
  /** The option's position in `enumOptions`, which keys it */
  index: number;
}

/** A labeled group of options, from `ui:options.optgroups` */
export interface SelectWidgetOptionGroup {
  /** The group's label */
  label: string;
  /** The group's options, in the order `optgroups` lists them */
  options: SelectWidgetOption[];
}

/** The value a select control holds, and how it holds it */
export type SelectWidgetValue =
  | {
      multiple: false;
      /** The encoded value of the selected option, or `''` when no option is selected */
      value: string;
    }
  | {
      multiple: true;
      /** The encoded values of the selected options, in enum order */
      value: string[];
    };

export type UseSelectWidgetPropsResult<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = SelectWidgetValue & {
  /** The control's id */
  id: string;
  /** The control's name, for a native form submission */
  name: string;
  /** Whether the field is required */
  required: boolean | undefined;
  /** Whether the control is disabled, which it is when the field is disabled or read-only */
  disabled: boolean;
  /** Whether the control takes focus when it mounts */
  autoFocus: boolean;
  /** The text shown while no option is selected */
  placeholder: string | undefined;
  /** Whether a single select offers an empty choice, which it does when the schema has no default */
  showPlaceholderOption: boolean;
  /** Every option, in enum order */
  options: SelectWidgetOption[];
  /** The options as drawn: grouped by `ui:options.optgroups`, with the ungrouped ones after the groups */
  groupedOptions: (SelectWidgetOption | SelectWidgetOptionGroup)[];
  /** The control's `aria-*` attributes */
  ariaProps: Omit<ControlAttributes, 'required'>;
  /** Decodes the encoded value or values the control selected into form data and reports it to `onChange`. A missing
   * value is an empty selection
   */
  onChange: (value: string | string[] | null | undefined) => void;
  /** Reports the form data to `onFocus`. It takes no argument, so it can be handed to any control's focus event */
  onFocus: () => void;
  /** Reports the form data to `onBlur`. It takes no argument, so it can be handed to any control's blur event */
  onBlur: () => void;
  /** The props of the `SelectedOptionDescription` that describes the selected `oneOf`/`anyOf` option */
  descriptionProps: SelectedOptionDescriptionProps<T, S, F>;
};

/** Hook which holds what every `SelectWidget` does whatever its UI library: it encodes the value as
 * `ui:optionValueFormat` asks, groups the options by `ui:options.optgroups` and disables the `ui:enumDisabled` ones,
 * decodes a change back into form data with `ui:emptyValue`, and supplies the control's id, name and `aria-*`
 * attributes. The handlers report nothing while the field is disabled or read-only. To be used by theme specific
 * `SelectWidget` implementations, and by an app's own select.
 *
 * @param props - The `WidgetProps` for the `SelectWidget`
 * @returns - The `UseSelectWidgetPropsResult` to be used within a `SelectWidget` implementation
 */
export default function useSelectWidgetProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>): UseSelectWidgetPropsResult<T, S, F> {
  const {
    id,
    htmlName,
    schema,
    options,
    value,
    required,
    disabled = false,
    readonly = false,
    multiple = false,
    autofocus = false,
    placeholder,
    onChange,
    onBlur,
    onFocus,
    registry,
    uiSchema,
    presentation,
  } = props;
  const { enumOptions, enumDisabled, emptyValue, optgroups } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const inactive = disabled || readonly;

  const { selectOptions, groupedOptions, optionValues } = useMemo(() => {
    const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);
    const toOption = (option: IndexedEnumOptionType<S>): SelectWidgetOption => ({
      value: domValues[option.index],
      label: option.label,
      disabled: option.disabled,
      index: option.index,
    });
    const grouped = groupEnumOptions<S>(enumOptions, optgroups, enumDisabled).map((item) =>
      isEnumOptionsGroup<S>(item) ? { label: item.label, options: item.options.map(toOption) } : toOption(item),
    );
    const flat = grouped
      .flatMap((item) => ('options' in item ? item.options : [item]))
      .sort((a, b) => a.index - b.index);
    return {
      selectOptions: flat,
      groupedOptions: grouped,
      optionValues: flat.map((option) => option.value),
    };
  }, [enumOptions, optgroups, enumDisabled, optionValueFormat]);

  // A control may report a multiple selection in the order its options are drawn, or picked, while `optgroups` is
  // presentational, so a selection is put back into enum order: grouping options must not reorder the array a form
  // submits. Under `realValue` a string no option holds is encoded as itself, which no control can show as selected, so
  // such a value is left out
  const inEnumOrder = useCallback(
    (encoded: string[]) => optionValues.filter((optionValue) => encoded.includes(optionValue)),
    [optionValues],
  );

  const handleChange = useCallback(
    (selected: string | string[] | null | undefined) => {
      if (inactive) {
        return;
      }
      const encoded = selected ?? (multiple ? [] : '');
      onChange(
        enumOptionValueDecoder<S>(
          Array.isArray(encoded) ? inEnumOrder(encoded) : encoded,
          enumOptions,
          optionValueFormat,
          emptyValue,
        ),
      );
    },
    [inactive, multiple, inEnumOrder, onChange, enumOptions, optionValueFormat, emptyValue],
  );

  const { handleFocus, handleBlur } = useSelectFocusHandlers<T, S, F>({
    id,
    value,
    options,
    onFocus: inactive ? undefined : onFocus,
    onBlur: inactive ? undefined : onBlur,
  });

  logUnsupportedDefaultForEnum<S>(id, schema, enumOptions, multiple);

  const held = inEnumOrder(
    [enumOptionSelectedValue<S, string | string[]>(value, enumOptions, multiple, optionValueFormat, [])].flat(),
  );
  const selectValue: SelectWidgetValue = multiple ? { multiple, value: held } : { multiple, value: held[0] ?? '' };

  return {
    ...selectValue,
    id,
    name: htmlName || id,
    required,
    disabled: inactive,
    autoFocus: autofocus,
    placeholder,
    showPlaceholderOption: !multiple && schema.default === undefined,
    options: selectOptions,
    groupedOptions,
    ariaProps: widgetAriaProps<T, S, F>(props),
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    descriptionProps: {
      id,
      multiple,
      options,
      registry,
      uiSchema,
      value,
      hideLabel: !widgetDrawsLabel<T, S, F>(props),
      presentation,
    },
  };
}
