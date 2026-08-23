import type { ChangeEvent, FocusEvent, InputHTMLAttributes, MouseEvent } from 'react';
import { useCallback } from 'react';
import { SchemaExamples } from '@rjsf/core';
import type { BaseInputTemplateProps, FormContextType, RJSFSchema } from '@rjsf/utils';
import { ariaDescribedByIds, examplesId, getInputProps } from '@rjsf/utils';

import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';

/** The `BaseInputTemplate` is the template to use to render the basic `<input>` component for the `core` theme.
 * It is used as the template for rendering many of the <input> based widgets that differ by `type` and callbacks only.
 * It can be customized/overridden for other themes or individual implementations as needed.
 *
 * @param props - The `WidgetProps` for this template
 */
export default function BaseInputTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  id,
  htmlName,
  placeholder,
  required,
  readonly,
  disabled,
  type,
  value,
  onChange,
  onChangeOverride,
  onBlur,
  onFocus,
  autofocus,
  options,
  schema,
  rawErrors = [],
  children,
  extraProps,
  className,
  registry,
}: BaseInputTemplateProps<T, S, F> & {
  /** `extraProps` reaches a widget through the `WidgetProps` index signature, so it is typed `unknown` there. It is
   * spread onto the `<input>`, so the only thing it can usefully carry is extra input attributes; saying so here keeps
   * the spread below type-safe without an assertion.
   */
  extraProps?: InputHTMLAttributes<HTMLInputElement>;
}) {
  const { ClearButton } = registry.templates.ButtonTemplates;
  const inputProps = {
    ...extraProps,
    ...getInputProps<T, S, F>(schema, type, options),
  };
  const handleChange = ({ target: { value: newValue } }: ChangeEvent<HTMLInputElement>) =>
    onChange(newValue === '' ? options.emptyValue : newValue);
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target?.value);
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target?.value);
  const handleClear = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(options.emptyValue ?? '');
    },
    [onChange, options.emptyValue],
  );

  return (
    <div className='p-0.5'>
      <Input
        id={id}
        name={htmlName || id}
        placeholder={placeholder}
        autoFocus={autofocus}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        className={cn({ 'border-destructive focus-visible:ring-0': rawErrors.length > 0 }, className)}
        list={schema.examples ? examplesId(id) : undefined}
        {...inputProps}
        value={value || value === 0 ? value : ''}
        onChange={onChangeOverride || handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        aria-describedby={ariaDescribedByIds(id, !!schema.examples)}
      />
      {options.allowClearTextInputs && !readonly && !disabled && value && (
        <ClearButton onClick={handleClear} registry={registry} />
      )}
      {children}
      <SchemaExamples id={id} schema={schema} />
    </div>
  );
}
