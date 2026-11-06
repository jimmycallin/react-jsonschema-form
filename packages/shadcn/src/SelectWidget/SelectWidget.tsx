import type {
  FormContextType,
  RJSFSchema,
  SelectWidgetOption,
  SelectWidgetOptionGroup,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import {
  getControlFallbackName,
  hasWidgetErrors,
  SelectedOptionDescription,
  TranslatableString,
  useSelectWidgetProps,
} from '@rjsf/utils';

import { FancyMultiSelect } from '../components/ui/fancy-multi-select.tsx';
import type { FancySelectItem, FancySelectSection } from '../components/ui/fancy-select.tsx';
import { FancySelect } from '../components/ui/fancy-select.tsx';
import { cn } from '../lib/utils.ts';

/** The item `FancySelect` draws for an option, selected by its encoded value */
function toItem({ value, label, index, disabled }: SelectWidgetOption): FancySelectItem<string> {
  return { value, label, index, disabled };
}

/** Splits `groupedOptions` into the `FancySelectSection` list consumed by `FancySelect`/`FancyMultiSelect`: one
 * section per `ui:options.optgroups` group, plus a trailing unheaded section for any ungrouped options, or no sections
 * at all when nothing is grouped
 */
function toSections<V>(
  groupedOptions: (SelectWidgetOption | SelectWidgetOptionGroup)[],
  itemFor: (option: SelectWidgetOption) => FancySelectItem<V>,
): FancySelectSection<V>[] | undefined {
  const sections: FancySelectSection<V>[] = [];
  const ungrouped: FancySelectItem<V>[] = [];
  groupedOptions.forEach((item) => {
    if ('options' in item) {
      sections.push({ label: item.label, items: item.options.map(itemFor) });
    } else {
      ungrouped.push(itemFor(item));
    }
  });
  if (sections.length === 0) {
    return undefined;
  }
  if (ungrouped.length > 0) {
    sections.push({ items: ungrouped });
  }
  return sections;
}

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function SelectWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { className, registry, options } = props;
  const select = useSelectWidgetProps<T, S, F>(props);
  const {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
  } = select.ariaProps;
  const ariaInvalid = select.ariaProps['aria-invalid'];

  // `optgroups` is presentational, so `items` stays in enum order: the fancy selects derive their current selection by
  // filtering `items`, so that order reaches the array written to formData. Grouping is applied to `sections`, which
  // is what the popup actually renders.
  const items = select.options.map(toItem);
  const sections = toSections(select.groupedOptions, toItem);
  // `FancyMultiSelect` searches an option by its value as well as its label, so its items are valued by the options'
  // own values, and so is the selection it compares with them
  const toValueItem = (option: SelectWidgetOption) => ({
    ...toItem(option),
    value: options.enumOptions?.[option.index]?.value,
  });
  const valueItems = select.options.map(toValueItem);
  const valueSections = toSections(select.groupedOptions, toValueItem);
  const selectedValues = select.multiple
    ? valueItems
        .filter((_, position) => select.value.includes(select.options[position].value))
        .map(({ value }) => value)
    : [];

  const cnClassName = cn({ 'border-destructive': hasWidgetErrors<T, S, F>(props) }, className);

  const placeholderText = select.placeholder || registry.translateString(TranslatableString.SelectPlaceholder);
  // With no label naming it, a combobox, which takes no name from the item it displays, is named by the field's label,
  // or, for a field with no title, such as an array item, by its placeholder, else the select prompt
  const fallbackName = getControlFallbackName<T, S, F>(props);

  return (
    <div className='p-0.5'>
      {!select.multiple ? (
        <FancySelect
          id={select.id}
          items={items}
          sections={sections}
          selected={select.value}
          onValueChange={select.onChange}
          autoFocus={select.autoFocus}
          disabled={select.disabled}
          required={select.required}
          placeholder={placeholderText}
          ariaLabel={ariaLabel}
          ariaLabelledby={ariaLabelledby}
          ariaInvalid={ariaInvalid}
          className={cnClassName}
          onFocus={select.onFocus}
          onBlur={select.onBlur}
          ariaDescribedby={ariaDescribedby}
        />
      ) : (
        <FancyMultiSelect
          // cmdk names its input by this text alone, so a caller's `aria-label` names it over the field's label, as the
          // fallback name does where the field has no title
          label={ariaLabel || fallbackName}
          placeholder={placeholderText}
          autoFocus={select.autoFocus}
          disabled={select.disabled}
          required={select.required}
          multiple
          className={cnClassName}
          items={valueItems}
          sections={valueSections}
          selected={selectedValues}
          onValueChange={(indexes) => {
            // `FancyMultiSelect` reports the selected options by their index
            select.onChange(select.options.filter(({ index }) => indexes.includes(index)).map(({ value }) => value));
          }}
          onFocus={select.onFocus}
          onBlur={select.onBlur}
          ariaDescribedby={ariaDescribedby}
          ariaInvalid={ariaInvalid}
        />
      )}
      <SelectedOptionDescription {...select.descriptionProps} />
    </div>
  );
}
