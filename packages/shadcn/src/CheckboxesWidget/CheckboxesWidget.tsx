import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { hasWidgetErrors, useCheckboxesWidgetProps } from '@rjsf/utils';

import { Checkbox } from '../components/ui/checkbox.tsx';
import { Label } from '../components/ui/label.tsx';
import { cn } from '../lib/utils.ts';

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const checkboxes = useCheckboxesWidgetProps<T, S, F>(props);
  const { inline } = checkboxes;
  const checkboxClassName = cn({ 'border-destructive': hasWidgetErrors<T, S, F>(props) }, props.className);

  return (
    <div
      id={checkboxes.id}
      {...checkboxes.groupProps}
      className={cn({ 'flex flex-col gap-2': !inline, 'flex flex-row gap-4 flex-wrap': inline })}
    >
      {checkboxes.options.map((option) => (
        <div className='flex items-center gap-2' key={option.index}>
          <Checkbox
            id={option.id}
            name={checkboxes.name}
            disabled={checkboxes.disabled || option.disabled}
            onCheckedChange={(state) => option.onCheckedChange(state === true)}
            className={checkboxClassName}
            checked={option.checked}
            value={option.value}
            autoFocus={option.autoFocus}
            onBlur={option.onBlur}
            onFocus={option.onFocus}
            {...checkboxes.optionProps}
          />
          <Label className='leading-tight' htmlFor={option.id}>
            {option.label}
          </Label>
        </div>
      ))}
    </div>
  );
}
