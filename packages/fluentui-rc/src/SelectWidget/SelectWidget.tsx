import { Dropdown, Field, makeStyles, mergeClasses, Option, OptionGroup } from '@fluentui/react-components';
import type { FormContextType, RJSFSchema, SelectWidgetOption, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  getLabelId,
  hasWidgetErrors,
  SelectedOptionDescription,
  useSelectWidgetProps,
  widgetDrawsLabelText,
} from '@rjsf/utils';

import { fieldLabelSlot } from '../utils.ts';

const useStyles = makeStyles({
  // Fluent's `Dropdown` keeps a 250px minimum width, which would push it out of a narrower layout grid column
  dropdown: { minWidth: 0 },
});

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
function SelectWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { className, label } = props;
  const classes = useStyles();
  const select = useSelectWidgetProps<T, S, F>(props);
  // An empty label element would still name the dropdown, by nothing, over an `aria-label` it is given, and one holding
  // only a required field's `*` would name it "star", so a label is drawn only with text. Where none names it, the
  // dropdown, whose contents are its value, is named by the field's label, its placeholder or the translated prompt
  const drawsLabel = widgetDrawsLabelText<T, S, F>(props);
  const labelId = getLabelId<T, S, F>(props);
  const selectedOptions = [select.value].flat().filter(Boolean);
  const dropdownValue = select.options
    .filter((option) => selectedOptions.includes(option.value))
    .map((option) => option.label)
    .join(', ');

  return (
    <Field
      label={drawsLabel ? fieldLabelSlot(label, select.id, labelId) : undefined}
      validationState={hasWidgetErrors<T, S, F>(props) ? 'error' : undefined}
      required={select.required}
    >
      <Dropdown
        id={select.id}
        name={select.name}
        multiselect={select.multiple}
        className={mergeClasses('form-control', classes.dropdown, className)}
        value={dropdownValue}
        disabled={select.disabled}
        autoFocus={select.autoFocus}
        onBlur={select.onBlur}
        onFocus={select.onFocus}
        onOptionSelect={(_, data) => select.onChange(select.multiple ? data.selectedOptions : data.selectedOptions[0])}
        selectedOptions={selectedOptions}
        // Fluent names the dropdown only through its label's `for` where that `for` matches its id, an id a nested
        // `anyOf`'s option selector shares with the selector above it, so the dropdown points at its own label's id too
        aria-labelledby={drawsLabel ? labelId : undefined}
        {...select.ariaProps}
      >
        {select.showPlaceholderOption && <Option value=''>{select.placeholder || ''}</Option>}
        {select.groupedOptions.map((item) =>
          'options' in item ? (
            <OptionGroup key={`optgroup-${item.label}`} label={item.label}>
              {item.options.map(renderOption)}
            </OptionGroup>
          ) : (
            renderOption(item)
          ),
        )}
      </Dropdown>
      <SelectedOptionDescription {...select.descriptionProps} />
    </Field>
  );
}

function renderOption({ index, value, disabled, label }: SelectWidgetOption) {
  return (
    <Option key={index} value={value} disabled={disabled}>
      {label}
    </Option>
  );
}

export default SelectWidget;
