import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  fieldShowsOwnErrors,
  getTemplates,
  getUiOptions,
  getWidgetDescription,
  hasWidgetErrors,
  labelValue,
  useCheckboxWidgetProps,
} from '@rjsf/utils';

import { Checkbox } from '../components/ui/checkbox.tsx';
import { Label } from '../components/ui/label.tsx';
import { cn } from '../lib/utils.ts';

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { label, schema, options, registry, presentation, uiSchema, className } = props;
  const checkbox = useCheckboxWidgetProps<T, S, F>(props);
  const hideLabel = !checkbox.drawsLabel;
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  const hasErrors = fieldShowsOwnErrors<T, S, F>(props);

  // Without a plan, core's `FieldTemplate` draws the description of a field whose `ui:widget` is the `checkbox` alias
  const description =
    presentation || getUiOptions(uiSchema).widget !== 'checkbox' ? getWidgetDescription<T, S, F>(props) : undefined;
  return (
    <div className={`relative ${checkbox.disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
      {description && (
        <DescriptionFieldTemplate
          id={description.id}
          description={description.text}
          hasErrors={hasErrors}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <div className='flex items-center gap-2 my-2'>
        <Checkbox
          id={checkbox.id}
          name={checkbox.name}
          checked={checkbox.checked}
          required={checkbox.required || undefined}
          disabled={checkbox.disabled}
          autoFocus={checkbox.autoFocus}
          onCheckedChange={(checked) => checkbox.onChange(checked === true)}
          onBlur={checkbox.onBlur}
          onFocus={checkbox.onFocus}
          {...checkbox.ariaProps}
          className={cn({ 'border-destructive': hasWidgetErrors<T, S, F>(props) }, className)}
        />
        <Label
          className='leading-tight data-invalid:text-destructive'
          htmlFor={checkbox.id}
          data-invalid={hasErrors || undefined}
        >
          {labelValue(label, hideLabel || !label)}
          {!hideLabel && label && checkbox.required && <span className='text-destructive ml-1'>*</span>}
        </Label>
      </div>
    </div>
  );
}
