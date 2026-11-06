import { Label, Checkbox } from '@fluentui/react-components';
import { Flex } from '@fluentui/react-migration-v0-v9';
import type { FormContextType, WidgetProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { useCheckboxesWidgetProps } from '@rjsf/utils';

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
  const checkboxes = useCheckboxesWidgetProps<T, S, F>(props, { drawsLabel: true });

  return (
    <>
      {checkboxes.drawsLabel && (
        <Label id={checkboxes.labelId} required={checkboxes.required}>
          {props.label}
        </Label>
      )}
      {/* The group carries the field's id and each checkbox its option's, as core's do */}
      <Flex column={!checkboxes.inline} id={checkboxes.id} {...checkboxes.groupProps}>
        {checkboxes.options.map((option) => (
          <Checkbox
            key={option.index}
            id={option.id}
            name={checkboxes.name}
            label={option.label}
            checked={option.checked}
            value={option.value}
            disabled={checkboxes.disabled || option.disabled}
            autoFocus={option.autoFocus}
            onChange={(event) => option.onCheckedChange(event.target.checked)}
            onBlur={option.onBlur}
            onFocus={option.onFocus}
            {...checkboxes.optionProps}
          />
        ))}
      </Flex>
    </>
  );
}
