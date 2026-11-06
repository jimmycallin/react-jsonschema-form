import type { ChangeEvent } from 'react';
import { useRef } from 'react';
import { Stack } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { hasWidgetErrors, labelValue, optionId, useRadioWidgetProps } from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';
import { Radio, RadioGroup } from '../components/ui/radio.tsx';
import { getChakra, labelledByOrNone } from '../utils.ts';

export default function RadioWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { options, readonly, label } = props;
  const radio = useRadioWidgetProps<T, S, F>(props, { drawsLabel: true });
  const { id, groupProps } = radio;
  const chakraProps = getChakra(options);
  const optionIds = new Map(radio.options.map((option) => [option.value, option.id]));

  const groupRef = useRef<HTMLDivElement>(null);
  // The label has no `for`, which can't name the group, so a click on it moves focus as zag's own radio group label
  // does: to the checked radio, else the first one a user can choose
  const focusRadio = () => {
    const group = groupRef.current;
    const input =
      group?.querySelector<HTMLInputElement>('input:checked:not(:disabled)') ??
      group?.querySelector<HTMLInputElement>('input:not(:disabled)');
    input?.focus();
  };
  return (
    <Field
      mb={1}
      disabled={radio.disabled}
      required={radio.required}
      readOnly={readonly}
      label={labelValue(label, !radio.drawsLabel)}
      ids={{ label: radio.labelId }}
      labelNamesNoControl
      onLabelClick={focusRadio}
      {...chakraProps}
    >
      <RadioGroup
        ref={groupRef}
        // The group carries the field's id and each radio its option's, as core's do
        ids={{ root: id, itemHiddenInput: (domValue) => optionIds.get(domValue) ?? optionId(id, -1) }}
        onChange={(event: ChangeEvent<HTMLInputElement>) => radio.onChange(event.target.value)}
        value={radio.value || null}
        name={radio.name}
        required={radio.required}
        invalid={hasWidgetErrors<T, S, F>(props)}
        {...groupProps}
        // Named by the label this widget draws, where the plan names it by no other, or by nothing where none is drawn:
        // Ark ignores an undefined override and would point the group at a label that isn't rendered
        aria-labelledby={labelledByOrNone(groupProps['aria-labelledby'], false)}
      >
        <Stack direction={radio.inline ? 'row' : 'column'}>
          {radio.options.map((option) => (
            <Radio
              value={option.value}
              key={option.index}
              disabled={radio.disabled || option.disabled}
              inputProps={{
                ...radio.optionProps,
                autoFocus: option.autoFocus,
                onFocus: option.onFocus,
                onBlur: option.onBlur,
              }}
            >
              {option.label}
            </Radio>
          ))}
        </Stack>
      </RadioGroup>
    </Field>
  );
}
