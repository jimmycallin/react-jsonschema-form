import type { ChangeEvent, MouseEvent } from 'react';
import { useCallback } from 'react';
import type { BaseInputTemplateProps, FormContextType, RJSFSchema } from '@rjsf/utils';
import { ariaDescribedByIds, examplesId, getInputProps } from '@rjsf/utils';
import { InputText } from 'primereact/inputtext';

import { getPrimeProps } from '../util';

/** The `BaseInputTemplate` is the template the fallback if no widget is specified.
 */
export default function BaseInputTemplate<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: BaseInputTemplateProps<T, S, F>) {
  const {
    id,
    htmlName,
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
    registry,
    rawErrors = [],
  } = props;

  const { ClearButton } = registry.templates.ButtonTemplates;
  const { AutoCompleteWidget } = registry.widgets;

  const inputProps = getInputProps<T, S, F>(schema, type, options);
  const primeProps = getPrimeProps<T, S, F>(options);
  const handleChange = ({ target: { value: newValue } }: ChangeEvent<HTMLInputElement>) =>
    onChange(newValue === '' ? options.emptyValue : newValue);
  const handleBlur = () => onBlur?.(id, value);
  const handleFocus = () => onFocus?.(id, value);
  const handleClear = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(options.emptyValue ?? '');
    },
    [onChange, options.emptyValue],
  );

  if (Array.isArray(schema.examples)) {
    return <AutoCompleteWidget {...props} />;
  }

  return (
    <>
      <InputText
        id={id}
        name={htmlName || id}
        placeholder={placeholder}
        {...primeProps}
        {...inputProps}
        required={required}
        autoFocus={autofocus}
        disabled={disabled || readonly}
        list={schema.examples ? examplesId(id) : undefined}
        value={value || value === 0 ? value : ''}
        invalid={rawErrors.length > 0}
        onChange={onChangeOverride || handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        aria-describedby={ariaDescribedByIds(id, !!schema.examples)}
      />
      {options.allowClearTextInputs && !readonly && !disabled && value && (
        <ClearButton registry={registry} onClick={handleClear} />
      )}
    </>
  );
}
