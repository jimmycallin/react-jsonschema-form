import type { FormContextType, RJSFSchema } from '@rjsf/utils';
import { ariaDescribedByIds, getInputProps } from '@rjsf/utils';
import type { ColorPickerChangeEvent } from 'primereact/colorpicker';
import { ColorPicker } from 'primereact/colorpicker';

import type { PrimeWidgetProps } from '../util';
import { getPrimeOptions } from '../util';

/** The `ColorWidget` component renders a color picker.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function ColorWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: PrimeWidgetProps<ColorPickerChangeEvent, T, S, F>) {
  const {
    id,
    placeholder,
    value,
    required,
    readonly,
    disabled,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    type,
  } = props;
  const inputProps = getInputProps<T, S, F>(schema, type, options);
  const primeOptions = getPrimeOptions<T, S, F>(options);
  const { inline } = primeOptions;
  const primeProps = primeOptions.prime || {};

  const handleChange = ({ target: { value: newValue } }: ColorPickerChangeEvent) =>
    onChange(newValue === '' ? options.emptyValue : newValue);
  const handleBlur = () => onBlur?.(id, value);
  const handleFocus = () => onFocus?.(id, value);

  return (
    <ColorPicker
      id={id}
      name={id}
      placeholder={placeholder}
      {...primeProps}
      {...inputProps}
      required={required}
      inline={inline}
      autoFocus={autofocus}
      disabled={disabled || readonly}
      value={value || ''}
      onChange={onChangeOverride || handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      aria-describedby={ariaDescribedByIds(id, !!schema.examples)}
    />
  );
}
