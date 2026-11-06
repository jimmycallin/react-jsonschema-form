import type { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import { getTemplates, getWidgetDescription, hasWidgetErrors, useCheckboxWidgetProps } from '@rjsf/utils';
import { Form } from 'react-bootstrap';

export default function CheckboxWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { label, schema, options, registry, uiSchema } = props;
  const checkbox = useCheckboxWidgetProps<T, S, F>(props);
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  const description = getWidgetDescription<T, S, F>(props);
  return (
    <Form.Group className={checkbox.disabled ? 'disabled' : ''}>
      {description && (
        <DescriptionFieldTemplate
          id={description.id}
          description={description.text}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Form.Check
        id={checkbox.id}
        name={checkbox.name}
        label={
          checkbox.drawsLabel && label ? (
            <>
              {label}
              {checkbox.required && <span className='required'>*</span>}
            </>
          ) : undefined
        }
        checked={checkbox.checked}
        required={checkbox.required}
        isInvalid={hasWidgetErrors<T, S, F>(props)}
        disabled={checkbox.disabled}
        autoFocus={checkbox.autoFocus}
        onChange={(event) => checkbox.onChange(event.target.checked)}
        type='checkbox'
        onBlur={checkbox.onBlur}
        onFocus={checkbox.onFocus}
        {...checkbox.ariaProps}
      />
    </Form.Group>
  );
}
