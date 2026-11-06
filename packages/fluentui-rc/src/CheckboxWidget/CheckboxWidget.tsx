import { Checkbox } from '@fluentui/react-components';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  getTemplates,
  getWidgetDescription,
  labelValue,
  useCheckboxWidgetProps,
  widgetDrawsLabelText,
} from '@rjsf/utils';

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { schema, label, registry, options, uiSchema } = props;
  const checkbox = useCheckboxWidgetProps<T, S, F>(props);
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  const description = getWidgetDescription<T, S, F>(props);
  const hideLabel = !widgetDrawsLabelText<T, S, F>(props);

  return (
    <>
      {description && (
        <DescriptionFieldTemplate
          id={description.id}
          description={description.text}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Checkbox
        id={checkbox.id}
        name={checkbox.name}
        label={labelValue(label, hideLabel)}
        checked={checkbox.checked}
        required={checkbox.required}
        disabled={checkbox.disabled}
        autoFocus={checkbox.autoFocus}
        onChange={(event) => checkbox.onChange(event.target.checked)}
        onBlur={checkbox.onBlur}
        onFocus={checkbox.onFocus}
        {...checkbox.ariaProps}
      />
    </>
  );
}
