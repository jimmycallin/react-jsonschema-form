import type { ChangeEvent } from 'react';
import { SchemaExamples } from '@rjsf/core';
import type { BaseInputTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { callerInputProps, hasWidgetErrors, useBaseInputProps } from '@rjsf/utils';
import { Form } from 'react-bootstrap';
import type { FormControlProps } from 'react-bootstrap';

/** The props this theme's `BaseInputTemplate` takes, to type the registry's `BaseInputTemplate` a widget passes
 * `extraProps` to
 */
export type BootstrapBaseInputTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = BaseInputTemplateProps<T, S, F> & {
  /** Props to spread on the `Form.Control` along with the ones the schema derives, or, without `Form.Control`'s own
   * `size`, `htmlSize`, `plaintext`, `isValid` and `isInvalid`, on the `Form.Range` of a `range` input. Its `pattern`,
   * `inputMode` and `accept` win over the derived ones
   */
  extraProps?: FormControlProps & Record<`data-${string}`, unknown>;
};

export default function BaseInputTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: BootstrapBaseInputTemplateProps<T, S, F>) {
  const { onChangeOverride, schema, children, extraProps, registry } = props;
  const { ClearButton } = registry.templates.ButtonTemplates;
  // The `pattern`, `inputMode`, `accept` and `multiple` in `extraProps` count as the widget's own, over its props
  const input = useBaseInputProps<T, S, F>({
    ...props,
    ...callerInputProps({ ...extraProps }),
    multiple: extraProps?.multiple ?? props.multiple,
  });
  const inputProps = { ...extraProps, ...input.inputProps };

  const isInvalid = hasWidgetErrors<T, S, F>(props);
  const controlProps = {
    id: input.id,
    name: input.name,
    placeholder: input.placeholder,
    autoFocus: input.autoFocus,
    required: input.required,
    disabled: input.disabled,
    title: input.title,
    readOnly: input.readOnly,
    list: input.listId,
    ...inputProps,
    value: input.value,
    onChange: onChangeOverride ?? ((event: ChangeEvent<HTMLInputElement>) => input.onChange(event.target.value)),
    onBlur: input.onBlur,
    onFocus: input.onFocus,
    ...input.ariaProps,
  };
  const {
    size: _size,
    htmlSize: _htmlSize,
    plaintext: _plaintext,
    isValid: _isValid,
    isInvalid: _isInvalid,
    ...rangeProps
  } = controlProps;
  return (
    <>
      {inputProps.type === 'range' ? (
        // `Form.Range` takes Bootstrap's `form-range` class through its prefix, which a `ThemeProvider` can rename, and
        // renders a bare `<input>` without `Form.Control`'s own props, so its error state is the class `Form.Control`
        // would add
        <Form.Range
          {...rangeProps}
          className={[inputProps.className, isInvalid && 'is-invalid'].filter(Boolean).join(' ') || undefined}
        />
      ) : (
        <Form.Control isInvalid={isInvalid} {...controlProps} />
      )}
      {input.showClearButton && <ClearButton registry={registry} onClick={input.onClear} />}
      {children}
      <SchemaExamples id={input.id} schema={schema} suggestions={input.exampleSuggestions} />
    </>
  );
}
