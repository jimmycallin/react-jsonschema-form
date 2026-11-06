import { Input } from '@chakra-ui/react';
import { SchemaExamples } from '@rjsf/core';
import type { BaseInputTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { hasWidgetErrors, labelValue, useBaseInputProps, widgetDrawsLabelText } from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';
import { getChakra } from '../utils.ts';

export default function BaseInputTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: BaseInputTemplateProps<T, S, F>) {
  const { label, schema, onChangeOverride, options, registry } = props;
  const drawsLabel = widgetDrawsLabelText<T, S, F>(props);
  const input = useBaseInputProps<T, S, F>(props);
  const { ClearButton } = registry.templates.ButtonTemplates;

  const chakraProps = getChakra(options);

  return (
    <Field
      mb={1}
      disabled={input.disabled || input.readOnly}
      required={input.required}
      readOnly={input.readOnly}
      invalid={hasWidgetErrors<T, S, F>(props)}
      label={labelValue(label, !drawsLabel)}
      id={input.id}
      {...chakraProps}
    >
      <Input
        id={input.id}
        name={input.name}
        value={input.value}
        onChange={onChangeOverride ?? ((event) => input.onChange(event.target.value))}
        onBlur={input.onBlur}
        onFocus={input.onFocus}
        autoFocus={input.autoFocus}
        placeholder={input.placeholder}
        title={input.title}
        {...input.inputProps}
        list={input.listId}
        {...input.ariaProps}
      />
      {input.showClearButton && <ClearButton registry={registry} onClick={input.onClear} />}
      <SchemaExamples id={input.id} schema={schema} suggestions={input.exampleSuggestions} />
    </Field>
  );
}
