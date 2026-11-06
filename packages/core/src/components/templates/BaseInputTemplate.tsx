import type { InputHTMLAttributes } from 'react';
import type { BaseInputTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { useBaseInputProps } from '@rjsf/utils';

import SchemaExamples from '../SchemaExamples.tsx';

/** The props core's `BaseInputTemplate` takes: the shared `BaseInputTemplateProps`, and the `<input>` attributes it puts
 * on the element from the props it doesn't read, such as `maxLength`, to type the registry's `BaseInputTemplate` a
 * widget passes them to
 */
export type CoreBaseInputTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = BaseInputTemplateProps<T, S, F> &
  Omit<InputHTMLAttributes<HTMLInputElement>, keyof BaseInputTemplateProps<T, S, F>>;

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
>(props: CoreBaseInputTemplateProps<T, S, F>) {
  const {
    id,
    name, // remove this from ...rest
    label, // remove this from ...rest
    htmlName,
    value,
    readonly,
    disabled,
    autofocus,
    onBlur,
    onFocus,
    onChange,
    onChangeOverride,
    options,
    schema,
    uiSchema,
    registry,
    // oxlint-disable-next-line typescript/no-deprecated -- kept out of the props this spreads onto the element
    rawErrors,
    type,
    // oxlint-disable-next-line typescript/no-deprecated -- kept out of the props this spreads onto the element
    hideLabel, // remove this from ...rest
    hideError, // remove this from ...rest
    presentation, // remove this from ...rest
    ...rest
  } = props;
  const { ClearButton } = registry.templates.ButtonTemplates;
  const { classMap } = registry;

  // Note: since React 15.2.0 we can't forward unknown element attributes, so we
  // exclude the "options" and "schema" ones here.
  if (!id) {
    // oxlint-disable-next-line no-console
    console.log('No id for', props);
    throw new Error(`no id for props ${JSON.stringify(props)}`);
  }
  const input = useBaseInputProps<T, S, F>(props);
  const inputProps = { ...rest, ...input.inputProps };

  let className = classMap.input;
  if (inputProps.type === 'file') {
    className = classMap.fileInput;
  } else if (inputProps.type === 'range') {
    className = classMap.rangeInput;
  }
  return (
    <>
      <input
        id={input.id}
        name={input.name}
        className={className}
        readOnly={input.readOnly}
        disabled={input.disabled}
        autoFocus={input.autoFocus}
        value={input.value}
        title={input.title}
        {...inputProps}
        list={input.listId}
        onChange={onChangeOverride ?? ((event) => input.onChange(event.target.value))}
        onBlur={input.onBlur}
        onFocus={input.onFocus}
        {...input.ariaProps}
      />
      {input.showClearButton && <ClearButton registry={registry} onClick={input.onClear} />}
      <SchemaExamples id={id} schema={schema} suggestions={input.exampleSuggestions} />
    </>
  );
}
