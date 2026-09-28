import type { FocusEvent } from 'react';
import { CheckboxGroup, FieldsetRoot, Stack, Text, FieldsetLegend } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  getOptionValueFormat,
  hasVisibleErrors,
  labelValue,
  optionId,
} from '@rjsf/utils';

import { Checkbox } from '../components/ui/checkbox.tsx';
import { getChakra } from '../utils.ts';

export default function CheckboxesWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, htmlName, disabled, options, value, readonly, onChange, onBlur, onFocus, label, hideLabel, uiSchema } =
    props;
  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);

  // Duck-typed rather than `instanceof HTMLInputElement`, which is false for inputs rendered inside an iframe.
  const decodeTarget = ({ target }: FocusEvent<HTMLElement>) =>
    enumOptionValueDecoder<S>(
      'value' in target && typeof target.value === 'string' ? target.value : '',
      enumOptions,
      optionValueFormat,
      emptyValue,
    );
  const handleBlur = (event: FocusEvent<HTMLElement>) => onBlur(id, decodeTarget(event));
  const handleFocus = (event: FocusEvent<HTMLElement>) => onFocus(id, decodeTarget(event));

  const row = options ? options.inline : false;
  const selectValue = enumOptionSelectedValue<S>(value, enumOptions, true, optionValueFormat, []) as string[];

  const chakraProps = getChakra({ uiSchema });
  const hasError = hasVisibleErrors(props);

  return (
    <FieldsetRoot mb={1} disabled={disabled || readonly} invalid={hasError} {...(chakraProps as any)}>
      {!hideLabel && label && <FieldsetLegend>{labelValue(label)}</FieldsetLegend>}
      <CheckboxGroup
        onValueChange={(option) =>
          onChange(enumOptionValueDecoder<S>(option, enumOptions, optionValueFormat, emptyValue))
        }
        value={selectValue}
        aria-describedby={ariaDescribedByIds(id)}
        readOnly={readonly}
        invalid={hasError}
      >
        <Stack direction={row ? 'row' : 'column'}>
          {Array.isArray(enumOptions) &&
            enumOptions.map((option, index) => {
              const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(option.value);
              return (
                <Checkbox
                  key={String(option.value)}
                  id={optionId(id, index)}
                  name={htmlName || id}
                  value={enumOptionValueEncoder(option.value, index, optionValueFormat)}
                  disabled={disabled || itemDisabled || readonly}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                >
                  {option.label && <Text>{option.label}</Text>}
                </Checkbox>
              );
            })}
        </Stack>
      </CheckboxGroup>
    </FieldsetRoot>
  );
}
