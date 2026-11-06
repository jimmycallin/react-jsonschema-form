import { SchemaExamples } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { useBaseInputProps } from '@rjsf/utils';
import { Input } from 'antd';

import useControlState from '../../controlState.ts';

/** The `PasswordWidget` component renders antd's password input, which can show the password it hides.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function PasswordWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { disabled, readonly, registry, schema } = props;
  const input = useBaseInputProps<T, S, F>({ ...props, type: 'password' });
  const control = useControlState<T, S, F>({ disabled, readonly, registry });
  const { ClearButton } = registry.templates.ButtonTemplates;

  return (
    <>
      <Input.Password
        autoFocus={input.autoFocus}
        disabled={control.disabled}
        id={input.id}
        name={input.name}
        onBlur={input.onBlur}
        onChange={(event) => input.onChange(event.target.value)}
        onFocus={input.onFocus}
        placeholder={input.placeholder}
        readOnly={input.readOnly}
        required={input.required}
        list={input.listId}
        {...input.inputProps}
        value={input.value}
        {...input.ariaProps}
      />
      {input.showClearButton && <ClearButton registry={registry} onClick={input.onClear} />}
      <SchemaExamples id={input.id} schema={schema} suggestions={input.exampleSuggestions} />
    </>
  );
}
