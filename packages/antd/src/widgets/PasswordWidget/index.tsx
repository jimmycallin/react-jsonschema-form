import type { ChangeEvent, FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds } from '@rjsf/utils';
import { Input } from 'antd';

import { getAntdFormContext } from '../../utils';

/** The `PasswordWidget` component uses the `BaseInputTemplate` changing the type to `password`.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function PasswordWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { disabled, registry, id, onBlur, onChange, onFocus, options, placeholder, readonly, value } = props;
  const { formContext } = registry;
  const { readonlyAsDisabled = true } = getAntdFormContext(formContext);

  const emptyValue = options.emptyValue || '';

  const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) =>
    onChange(target.value === '' ? emptyValue : target.value);

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target.value);

  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target.value);

  return (
    <Input.Password
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      value={value || ''}
      aria-describedby={ariaDescribedByIds(id)}
    />
  );
}
