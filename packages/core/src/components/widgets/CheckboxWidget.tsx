import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  fieldShowsOwnErrors,
  getTemplates,
  getUiOptions,
  getWidgetDescription,
  joinClassNames,
  labelValue,
  useCheckboxWidgetProps,
} from '@rjsf/utils';

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
function CheckboxWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { schema, uiSchema, options, label, registry, presentation } = props;
  const checkbox = useCheckboxWidgetProps<T, S, F>(props);
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  const { classMap } = registry;
  // The field's own error state, as its wrapper has it, rather than its control's, which is invalid while a field above
  // shows its errors even where this one hides them
  const hasErrors = fieldShowsOwnErrors<T, S, F>(props);
  // The plan says whether the description is this widget's to draw; without a plan, a template rendering the
  // `checkbox` alias draws it itself
  const description =
    presentation || getUiOptions(uiSchema).widget !== 'checkbox' ? getWidgetDescription<T, S, F>(props) : undefined;
  return (
    <div
      className={joinClassNames('rjsf-checkbox', classMap.checkboxWrapper, checkbox.disabled && classMap.disabled)}
      data-disabled={checkbox.disabled || undefined}
    >
      {description && (
        <DescriptionFieldTemplate
          id={description.id}
          description={description.text}
          hasErrors={hasErrors}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <label className={classMap.checkboxLabel} data-invalid={hasErrors || undefined}>
        <input
          type='checkbox'
          className={classMap.checkboxInput}
          id={checkbox.id}
          name={checkbox.name}
          checked={checkbox.checked}
          required={checkbox.required}
          disabled={checkbox.disabled}
          autoFocus={checkbox.autoFocus}
          onChange={(event) => checkbox.onChange(event.target.checked)}
          onBlur={checkbox.onBlur}
          onFocus={checkbox.onFocus}
          {...checkbox.ariaProps}
        />
        {labelValue(
          <span>
            {label}
            {checkbox.required && <span className='rjsf-required'>*</span>}
          </span>,
          !checkbox.drawsLabel,
        )}
      </label>
    </div>
  );
}

export default CheckboxWidget;
