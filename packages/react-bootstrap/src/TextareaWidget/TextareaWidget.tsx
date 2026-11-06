import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { hasWidgetErrors, useTextareaWidgetProps } from '@rjsf/utils';
import { FormControl, InputGroup } from 'react-bootstrap';

export default function TextareaWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const textarea = useTextareaWidgetProps<T, S, F>(props);

  return (
    <InputGroup>
      <FormControl
        id={textarea.id}
        name={textarea.name}
        as='textarea'
        placeholder={textarea.placeholder}
        disabled={textarea.disabled}
        readOnly={textarea.readOnly}
        value={textarea.value}
        required={textarea.required}
        autoFocus={textarea.autoFocus}
        rows={textarea.rows ?? 5}
        isInvalid={hasWidgetErrors<T, S, F>(props)}
        onChange={(event) => textarea.onChange(event.target.value)}
        onBlur={textarea.onBlur}
        onFocus={textarea.onFocus}
        {...textarea.ariaProps}
      />
    </InputGroup>
  );
}
