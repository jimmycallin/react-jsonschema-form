import type { ChangeEvent, FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds } from '@rjsf/utils';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';

export default function TextareaWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  id,
  htmlName,
  placeholder,
  value,
  required,
  disabled,
  autofocus,
  readonly,
  onBlur,
  onFocus,
  onChange,
  options,
}: WidgetProps<T, S, F>) {
  const handleChange = ({ target: { value: newValue } }: ChangeEvent<HTMLTextAreaElement>) =>
    onChange(newValue === '' ? options.emptyValue : newValue);
  const handleBlur = ({ target }: FocusEvent<HTMLTextAreaElement>) => onBlur(id, target?.value);
  const handleFocus = ({ target }: FocusEvent<HTMLTextAreaElement>) => onFocus(id, target?.value);

  return (
    <InputGroup>
      <FormControl
        id={id}
        name={htmlName || id}
        as='textarea'
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readonly}
        value={value}
        required={required}
        autoFocus={autofocus}
        rows={options.rows || 5}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        aria-describedby={ariaDescribedByIds(id)}
      />
    </InputGroup>
  );
}
