import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { hasWidgetErrors, useCheckboxesWidgetProps } from '@rjsf/utils';
import { Form } from 'react-bootstrap';

export default function CheckboxesWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const checkboxes = useCheckboxesWidgetProps<T, S, F>(props);
  const invalid = hasWidgetErrors<T, S, F>(props);

  return (
    <Form.Group id={checkboxes.id} {...checkboxes.groupProps}>
      {checkboxes.options.map((option) => (
        <Form.Check
          key={option.index}
          inline={checkboxes.inline}
          checked={option.checked}
          isInvalid={invalid}
          value={option.value}
          className='bg-transparent border-0'
          type='checkbox'
          id={option.id}
          name={checkboxes.name}
          label={option.label}
          autoFocus={option.autoFocus}
          onChange={(event) => option.onCheckedChange(event.target.checked)}
          onBlur={option.onBlur}
          onFocus={option.onFocus}
          disabled={checkboxes.disabled || option.disabled}
          {...checkboxes.optionProps}
        />
      ))}
    </Form.Group>
  );
}
