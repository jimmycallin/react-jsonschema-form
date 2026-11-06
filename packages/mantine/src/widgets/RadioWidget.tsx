import { Radio, Flex } from '@mantine/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { useRadioWidgetProps } from '@rjsf/utils';

import { cleanupOptions, getDescriptionProps, GroupOptions, groupExcludedKeys, useGroupAriaProps } from '../utils.tsx';

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RadioWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const radio = useRadioWidgetProps<T, S, F>(props);
  const themeProps = cleanupOptions(props.options, props, groupExcludedKeys);
  const { groupProps, optionProps } = useGroupAriaProps('RadioGroup', props);

  return (
    <Radio.Group
      id={radio.id}
      name={radio.name}
      value={radio.value || undefined}
      onChange={radio.onChange}
      required={radio.required}
      readOnly={radio.disabled}
      {...themeProps}
      {...groupProps}
      {...getDescriptionProps(props)}
    >
      {radio.options.length > 0 ? (
        <Flex mt='xs' direction={radio.inline ? 'row' : 'column'} gap='xs' wrap='wrap'>
          <GroupOptions optionProps={optionProps}>
            {(describedOptionProps) =>
              radio.options.map((option) => (
                <Radio
                  key={option.index}
                  id={option.id}
                  value={option.value}
                  label={option.label}
                  disabled={radio.disabled || option.disabled}
                  autoFocus={option.autoFocus}
                  onBlur={option.onBlur}
                  onFocus={option.onFocus}
                  {...describedOptionProps}
                />
              ))
            }
          </GroupOptions>
        </Flex>
      ) : null}
    </Radio.Group>
  );
}
