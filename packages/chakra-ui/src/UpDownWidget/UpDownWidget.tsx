import type { NumberInputValueChangeDetails } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  getControlAttributes,
  hasWidgetErrors,
  labelValue,
  useBaseInputProps,
  widgetDrawsLabelText,
} from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';
import { NumberInputRoot } from '../components/ui/number-input.tsx';
import { getChakra } from '../utils.ts';

export default function UpDownWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { label } = props;
  const drawsLabel = widgetDrawsLabelText<T, S, F>(props);
  // Zag's number input steps through its own `step`, which takes a number rather than `'any'`
  const input = useBaseInputProps<T, S, F>({ ...props, type: 'number' }, false);
  const { min, max, step } = input.inputProps;
  // Left out where the schema sets none, as Zag reads an `undefined` bound as one it was given rather than its default
  const spec = {
    ...(typeof min === 'number' && { min }),
    ...(typeof max === 'number' && { max }),
    ...(typeof step === 'number' && { step }),
  };

  const chakraProps = getChakra(props.options);

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
      <NumberInputRoot
        // Zag's number input is uncontrolled while `value` is `undefined`, and would go on showing the last number
        // after the form clears the value, so a missing value is passed as the empty input it is. Its value is the
        // input's text, which it compares by identity with the text it formats on blur and Enter, so a stored number
        // is passed as its text too, or that comparison would report a change nobody made. Its blur would clamp a
        // number past the safe integers, the bounds it takes when the schema sets none, and only on blur, not Enter;
        // the schema's own bounds are the form's to validate, so that clamp is turned off
        value={String(input.value)}
        clampValueOnBlur={false}
        {...spec}
        onValueChange={({ value }: NumberInputValueChangeDetails) => input.onChange(value)}
        // The handlers sit on the root, so an increment or decrement trigger taking the focus reports it too
        onBlur={input.onBlur}
        onFocus={input.onFocus}
        inputProps={{ ...getControlAttributes<T, S, F>(props), autoFocus: input.autoFocus }}
        id={input.id}
        name={input.name}
      />
    </Field>
  );
}
