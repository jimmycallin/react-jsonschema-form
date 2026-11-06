import type { InputHTMLAttributes } from 'react';
import { SchemaExamples } from '@rjsf/core';
import type { BaseInputTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { callerInputProps, hasWidgetErrors, useBaseInputProps } from '@rjsf/utils';

import { Input } from '../components/ui/input.tsx';
import { cn } from '../lib/utils.ts';

/** The props this theme's `BaseInputTemplate` takes, to type the registry's `BaseInputTemplate` a widget passes
 * `extraProps` to
 */
export type ShadcnBaseInputTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = BaseInputTemplateProps<T, S, F> & {
  /** Props to spread on the input along with the ones the schema derives. Its `pattern`, `inputMode` and `accept` win
   * over the derived ones
   */
  extraProps?: InputHTMLAttributes<HTMLInputElement> & Record<`data-${string}`, unknown>;
};

/** The `BaseInputTemplate` is the template to use to render the basic `<input>` component for the `core` theme.
 * It is used as the template for rendering many of the <input> based widgets that differ by `type` and callbacks only.
 * It can be customized/overridden for other themes or individual implementations as needed.
 *
 * @param props - The `WidgetProps` for this template
 */
export default function BaseInputTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ShadcnBaseInputTemplateProps<T, S, F>) {
  const { onChangeOverride, schema, children, extraProps, className, registry } = props;
  const { ClearButton } = registry.templates.ButtonTemplates;
  // The `pattern`, `inputMode`, `accept` and `multiple` in `extraProps` count as the widget's own, over its props
  const input = useBaseInputProps<T, S, F>({
    ...props,
    ...callerInputProps({ ...extraProps }),
    multiple: extraProps?.multiple ?? props.multiple,
  });
  const inputProps = { ...extraProps, ...input.inputProps };

  return (
    <div className='p-0.5'>
      <Input
        id={input.id}
        name={input.name}
        placeholder={input.placeholder}
        autoFocus={input.autoFocus}
        required={input.required}
        disabled={input.disabled}
        readOnly={input.readOnly}
        list={input.listId}
        title={input.title}
        {...inputProps}
        className={cn({ 'border-destructive': hasWidgetErrors<T, S, F>(props) }, className, extraProps?.className)}
        value={input.value}
        onChange={onChangeOverride ?? ((event) => input.onChange(event.target.value))}
        onBlur={input.onBlur}
        onFocus={input.onFocus}
        {...input.ariaProps}
      />
      {input.showClearButton && <ClearButton onClick={input.onClear} registry={registry} />}
      {children}
      <SchemaExamples id={input.id} schema={schema} suggestions={input.exampleSuggestions} />
    </div>
  );
}
