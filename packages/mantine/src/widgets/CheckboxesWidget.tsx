import { Checkbox, Flex } from '@mantine/core';
import type { FormContextType, WidgetProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { useCheckboxesWidgetProps } from '@rjsf/utils';

import { cleanupOptions, getDescriptionProps, GroupOptions, groupExcludedKeys, useGroupAriaProps } from '../utils.tsx';

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const checkboxes = useCheckboxesWidgetProps<T, S, F>(props);
  const themeProps = cleanupOptions(props.options, props, groupExcludedKeys);
  const { groupProps, optionProps } = useGroupAriaProps('CheckboxGroup', props);

  // A group with no options is still drawn, so its errors keep the label and description that say which field they
  // belong to
  return (
    <Checkbox.Group
      id={checkboxes.id}
      value={checkboxes.value}
      onChange={checkboxes.onChange}
      required={checkboxes.required}
      readOnly={checkboxes.disabled}
      {...themeProps}
      {...groupProps}
      {...getDescriptionProps(props)}
    >
      <Flex mt='xs' direction={checkboxes.inline ? 'row' : 'column'} gap='xs' wrap='wrap'>
        <GroupOptions optionProps={optionProps}>
          {(describedOptionProps) =>
            checkboxes.options.map((option) => (
              <Checkbox
                key={option.index}
                id={option.id}
                name={checkboxes.name}
                value={option.value}
                label={option.label}
                disabled={checkboxes.disabled || option.disabled}
                autoFocus={option.autoFocus}
                onBlur={option.onBlur}
                onFocus={option.onFocus}
                {...describedOptionProps}
              />
            ))
          }
        </GroupOptions>
      </Flex>
    </Checkbox.Group>
  );
}
