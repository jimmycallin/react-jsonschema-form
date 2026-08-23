import type { FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, rangeSpec } from '@rjsf/utils';
import type { SliderChangeEvent } from 'primereact/slider';
import { Slider } from 'primereact/slider';

import { getPrimeProps } from '../util';

/** The `RangeWidget` component uses the `Slider` from PrimeReact, wrapping the result
 * in a div, with the value alongside it.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RangeWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { value, readonly, disabled, onBlur, onFocus, options, schema, onChange, id } = props;
  const primeProps = getPrimeProps<T, S, F>(options);
  const sliderProps = { value, id, ...rangeSpec<S>(schema) };

  const handleChange = (e: SliderChangeEvent) => {
    onChange(e.value ?? options.emptyValue);
  };
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target?.value);
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target?.value);

  return (
    <Slider
      {...primeProps}
      disabled={disabled || readonly}
      onMouseDown={(e) => e.stopPropagation()}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      {...sliderProps}
      aria-describedby={ariaDescribedByIds(id)}
    />
  );
}
