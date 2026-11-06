import { useMemo, useRef } from 'react';
import { createListCollection, Select as ChakraSelect } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, SelectWidgetOption, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  getLabelId,
  hasWidgetErrors,
  labelValue,
  SelectedOptionDescription,
  useSelectWidgetProps,
  widgetDrawsLabelText,
} from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';
import { SelectRoot, SelectTrigger, SelectValueText } from '../components/ui/select.tsx';
import { getChakra, labelledByOrNone } from '../utils.ts';

function renderItem(item: SelectWidgetOption) {
  return (
    <ChakraSelect.Item item={item} key={item.index}>
      {item.label}
      <ChakraSelect.ItemIndicator />
    </ChakraSelect.Item>
  );
}

export default function SelectWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { options, label, readonly } = props;
  const select = useSelectWidgetProps<T, S, F>(props);
  const { id, multiple, groupedOptions, ariaProps } = select;
  const drawsLabel = widgetDrawsLabelText<T, S, F>(props);
  const labelId = getLabelId<T, S, F>(props);
  const labelledBy = labelledByOrNone(ariaProps['aria-labelledby'], drawsLabel);

  // The collection lists the items in the order they are drawn, which keyboard navigation follows
  const collection = useMemo(
    () =>
      createListCollection({ items: groupedOptions.flatMap((item) => ('options' in item ? item.options : [item])) }),
    [groupedOptions],
  );
  // Chakra's SelectRoot always holds a string array, with no item selected as an empty one
  const selected = [select.value].flat().filter(Boolean);

  const containerRef = useRef(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const chakraProps = getChakra(options);

  return (
    <Field
      ref={containerRef}
      mb={1}
      disabled={select.disabled}
      required={select.required}
      readOnly={readonly}
      invalid={hasWidgetErrors<T, S, F>(props)}
      label={labelValue(label, !drawsLabel)}
      // A `for` naming the trigger would make a click on the label click the trigger, which opens the listbox, so the
      // label has none, names the trigger through `aria-labelledby` and, as zag's select label does, only focuses it
      labelNamesNoControl
      onLabelClick={() => triggerRef.current?.focus()}
      id={id}
      ids={{ label: labelId }}
      position='relative'
      {...chakraProps}
    >
      <SelectedOptionDescription {...select.descriptionProps} />
      <SelectRoot
        collection={collection}
        id={id}
        // The trigger, which a user focuses, carries the field's id, so `focusOnFirstError` reaches it, and Ark points
        // it at the label's id. Ark's own ids replace the field's, so the label's is restated
        ids={{ trigger: id, label: labelId }}
        hiddenSelectLabelledBy={labelledBy}
        name={select.name}
        multiple={multiple}
        closeOnSelect={!multiple}
        onBlur={select.onBlur}
        onValueChange={({ value }) => select.onChange(multiple ? value : value[0])}
        onFocus={select.onFocus}
        value={selected}
        positioning={{ placement: 'bottom' }}
      >
        <SelectTrigger ref={triggerRef} autoFocus={select.autoFocus} {...ariaProps} aria-labelledby={labelledBy}>
          <SelectValueText placeholder={select.placeholder} />
        </SelectTrigger>
        <ChakraSelect.Positioner minWidth='100% !important' zIndex='2 !important' top='calc(100% + 5px) !important'>
          <ChakraSelect.Content aria-labelledby={labelledBy} aria-label={ariaProps['aria-label']}>
            {groupedOptions.map((option) =>
              'options' in option ? (
                <ChakraSelect.ItemGroup key={`optgroup-${option.label}`}>
                  <ChakraSelect.ItemGroupLabel>{option.label}</ChakraSelect.ItemGroupLabel>
                  {option.options.map(renderItem)}
                </ChakraSelect.ItemGroup>
              ) : (
                renderItem(option)
              ),
            )}
          </ChakraSelect.Content>
        </ChakraSelect.Positioner>
      </SelectRoot>
    </Field>
  );
}
