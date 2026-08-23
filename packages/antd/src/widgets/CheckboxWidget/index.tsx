import type { FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, labelValue } from '@rjsf/utils';
import type { CheckboxProps } from 'antd';
import { Checkbox } from 'antd';

import { getAntdFormContext } from '../../utils';

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { autofocus, disabled, registry, id, htmlName, label, hideLabel, onBlur, onChange, onFocus, readonly, value } =
    props;
  const { formContext } = registry;
  const { readonlyAsDisabled = true } = getAntdFormContext(formContext);

  const handleChange: NonNullable<CheckboxProps['onChange']> = ({ target }) => onChange(target.checked);

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target?.checked);

  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target?.checked);

  // Antd's typescript definitions do not contain the following props that are actually necessary and, if provided,
  // they are used, so hacking them in via by spreading `extraProps` on the component to avoid typescript errors
  const extraProps = {
    onBlur: !readonly ? handleBlur : undefined,
    onFocus: !readonly ? handleFocus : undefined,
  };
  return (
    <Checkbox
      autoFocus={autofocus}
      checked={typeof value === 'undefined' ? false : value}
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={htmlName || id}
      onChange={!readonly ? handleChange : undefined}
      {...extraProps}
      aria-describedby={ariaDescribedByIds(id)}
    >
      {labelValue(label, hideLabel, '')}
    </Checkbox>
  );
}
