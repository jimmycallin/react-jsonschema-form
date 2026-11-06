import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { hasWidgetErrors, useRadioWidgetProps } from '@rjsf/utils';
import { Form } from 'react-bootstrap';

export default function RadioWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const radio = useRadioWidgetProps<T, S, F>(props);
  const invalid = hasWidgetErrors<T, S, F>(props);

  return (
    <Form.Group className='mb-0' id={radio.id} {...radio.groupProps}>
      {radio.options.map((option) => (
        <Form.Check
          inline={radio.inline}
          label={option.label}
          id={option.id}
          key={option.index}
          name={radio.name}
          type='radio'
          disabled={radio.disabled || option.disabled}
          checked={option.checked}
          required={radio.required}
          autoFocus={option.autoFocus}
          isInvalid={invalid}
          value={option.value}
          onChange={() => radio.onChange(option.value)}
          onBlur={option.onBlur}
          onFocus={option.onFocus}
          {...radio.optionProps}
        />
      ))}
    </Form.Group>
  );
}
