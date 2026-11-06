import { chakra, CheckboxGroup, FieldsetRoot, Stack, Text, useSlotRecipe } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { hasWidgetErrors, labelValue, useCheckboxesWidgetProps } from '@rjsf/utils';

import { Checkbox } from '../components/ui/checkbox.tsx';
import { RequiredMarker } from '../components/ui/field.tsx';
import { getChakra, labelledByOrNone } from '../utils.ts';

export default function CheckboxesWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { options, readonly, label } = props;
  const checkboxes = useCheckboxesWidgetProps<T, S, F>(props, { drawsLabel: true });
  const { drawsLabel, labelId, disabled } = checkboxes;
  const chakraProps = getChakra(options);
  const hasError = hasWidgetErrors<T, S, F>(props);

  const legendStyles = useSlotRecipe({ key: 'fieldset' })().legend;

  return (
    <FieldsetRoot
      mb={1}
      disabled={disabled}
      invalid={hasError}
      // Ark points the fieldset at a legend id of its own, which never renders, so it is pointed at nothing: only the
      // group inside it, which carries the field's id, is named by the label
      aria-labelledby={labelledByOrNone(undefined, false)}
      {...chakraProps}
    >
      {drawsLabel && (
        // Styled as the recipe's legend, but not drawn as a `<legend>`, which would name the fieldset too, so a screen
        // reader entering the group would hear its name twice
        <chakra.div
          id={labelId}
          className='fieldset__legend'
          css={legendStyles}
          data-disabled={disabled ? '' : undefined}
        >
          {labelValue(label)}
          {checkboxes.required && <RequiredMarker ms={1} />}
        </chakra.div>
      )}
      <CheckboxGroup
        // The group carries the field's id and each checkbox's `<input>` its option's, as core's do
        id={checkboxes.id}
        onValueChange={checkboxes.onChange}
        value={checkboxes.value}
        {...checkboxes.groupProps}
        readOnly={readonly}
        invalid={hasError}
      >
        <Stack direction={checkboxes.inline ? 'row' : 'column'}>
          {checkboxes.options.map((option) => (
            <Checkbox
              key={option.index}
              id={option.id}
              ids={{ hiddenInput: option.id }}
              name={checkboxes.name}
              value={option.value}
              disabled={disabled || option.disabled}
              onBlur={option.onBlur}
              onFocus={option.onFocus}
              inputProps={{ ...checkboxes.optionProps, autoFocus: option.autoFocus }}
            >
              {option.label && <Text>{option.label}</Text>}
            </Checkbox>
          ))}
        </Stack>
      </CheckboxGroup>
    </FieldsetRoot>
  );
}
