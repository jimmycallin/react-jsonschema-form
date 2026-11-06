import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { hasWidgetErrors, useRadioWidgetProps } from '@rjsf/utils';

import { Label } from '../components/ui/label.tsx';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group.tsx';
import { cn } from '../lib/utils.ts';

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RadioWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const radio = useRadioWidgetProps<T, S, F>(props);
  const radioClassName = cn({ 'border-destructive': hasWidgetErrors<T, S, F>(props) });

  return (
    <div className='mb-0'>
      <RadioGroup
        id={radio.id}
        name={radio.name}
        {...radio.groupProps}
        value={radio.value}
        required={radio.required}
        disabled={radio.disabled}
        onValueChange={radio.onChange}
        orientation={radio.inline ? 'horizontal' : 'vertical'}
        className={cn('flex flex-wrap', { 'flex-col': !radio.inline }, props.className)}
      >
        {radio.options.map((option) => (
          <div className='flex items-center gap-2' key={option.index}>
            <RadioGroupItem
              value={option.value}
              id={option.id}
              disabled={radio.disabled || option.disabled}
              autoFocus={option.autoFocus}
              // On each radio rather than the group: Radix's group takes focus itself to pass it on to a radio, as when
              // it is tabbed into or focusOnFirstError focuses the field's id, which it carries, so it would report a
              // focus and blur of no value first
              onBlur={option.onBlur}
              onFocus={option.onFocus}
              className={radioClassName}
              {...radio.optionProps}
            />
            <Label className='leading-tight' htmlFor={option.id}>
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
