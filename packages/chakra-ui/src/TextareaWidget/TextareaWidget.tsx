import { Textarea } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { hasWidgetErrors, labelValue, useTextareaWidgetProps, widgetDrawsLabelText } from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';
import { getChakra } from '../utils.ts';

export default function TextareaWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { label, options } = props;
  const drawsLabel = widgetDrawsLabelText<T, S, F>(props);
  const textarea = useTextareaWidgetProps<T, S, F>(props);

  const chakraProps = getChakra(options);

  return (
    <Field
      mb={1}
      disabled={textarea.disabled || textarea.readOnly}
      required={textarea.required}
      readOnly={textarea.readOnly}
      invalid={hasWidgetErrors<T, S, F>(props)}
      label={labelValue(label, !drawsLabel)}
      id={textarea.id}
      {...chakraProps}
    >
      <Textarea
        id={textarea.id}
        name={textarea.name}
        value={textarea.value}
        placeholder={textarea.placeholder}
        autoFocus={textarea.autoFocus}
        onChange={(event) => textarea.onChange(event.target.value)}
        onBlur={textarea.onBlur}
        onFocus={textarea.onFocus}
        rows={textarea.rows}
        {...textarea.ariaProps}
      />
    </Field>
  );
}
