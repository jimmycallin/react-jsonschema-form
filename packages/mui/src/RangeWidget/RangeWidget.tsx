import { useEffect, useRef } from 'react';
import FormLabel from '@mui/material/FormLabel';
import type { SliderProps } from '@mui/material/Slider';
import Slider from '@mui/material/Slider';
import type { FormContextType, GenericObjectType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  TranslatableString,
  getLabelId,
  isSchemaObject,
  labelValue,
  numericWidgetStoresString,
  rangeSpec,
  toNumericValue,
  useRangeWidgetProps,
  widgetDrawsLabel,
  widgetDrawsLabelText,
} from '@rjsf/utils';

import { getMuiProps, withInputSlot } from '../util.ts';

/** Properties available for the `rjsfSlotProps` target of the RangeWidget. */
export interface RangeWidgetMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the RangeWidget. */
  rjsfSlotProps?: {
    /** Props applied to the MUI `Slider` component. */
    slider?: SliderProps;
  };
}

/** The `RangeWidget` component uses the `BaseInputTemplate` changing the type to `range` and wrapping the result
 * in a div, with the value along side it.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RangeWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { value, options, schema, onChange, label, autofocus, registry } = props;
  const range = useRangeWidgetProps<T, S, F>(props);
  const { id, required, spec } = range;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const rootRef = useRef<HTMLSpanElement>(null);
  const isRangeOfValues = Array.isArray(value);
  const focusOnMount = useRef(autofocus && isRangeOfValues);
  // A range of several values focuses its first thumb, as `autoFocus` would one thumb, and like `autoFocus` only on mount,
  // so an `autofocus` that turns true later doesn't take focus from the user
  useEffect(() => {
    if (focusOnMount.current) {
      rootRef.current?.querySelector('input')?.focus();
    }
  }, []);
  const { items } = schema;
  const itemSchemaAt = (index: number) => (Array.isArray(items) ? items[index] : items);
  // An unset part is drawn at its item's minimum, as an empty one-value range is at its own, so the range keeps a thumb
  // for each part, and moving another part writes a number the item accepts
  const unsetPartAt = (index: number) => {
    const itemSchema = itemSchemaAt(index);
    return (isSchemaObject<S>(itemSchema) ? rangeSpec<S>(itemSchema).min : undefined) ?? spec.min ?? 0;
  };
  const sliderValue = isRangeOfValues
    ? value.map((part, index) => toNumericValue(part) ?? unsetPartAt(index))
    : range.value;
  const sliderProps = { value: sliderValue, name: range.name, ...spec };

  const writePart = (part: number, index: number) => {
    const itemSchema = itemSchemaAt(index);
    const original: unknown = isRangeOfValues ? value[index] : undefined;
    const partStoresString = isSchemaObject<S>(itemSchema)
      ? numericWidgetStoresString<S>(itemSchema, original)
      : typeof original === 'string';
    return partStoresString ? String(part) : part;
  };
  const handleChange: NonNullable<SliderProps['onChange']> = (_, newValue) => {
    if (!Array.isArray(newValue)) {
      range.onChange(newValue);
    } else if (!range.disabled) {
      onChange(newValue.map(writePart));
    }
  };

  const { rjsfSlotProps: muiSlotProps, ...otherMuiProps } = getMuiProps<T, S, F, RangeWidgetMuiProps>(options);
  // The `Slider` puts a name the form author gives it on the `<input>`, where the `input` slot would replace it, so the
  // plan's name goes in that slot only where the author gives none: the author's choice wins, as on every widget
  const authorSlider: SliderProps = { ...otherMuiProps, ...muiSlotProps?.slider };
  const authorNamesSlider = [
    authorSlider['aria-label'],
    authorSlider['aria-labelledby'],
    authorSlider.getAriaLabel,
  ].some((name) => name !== undefined);
  const { 'aria-label': plannedLabel, 'aria-labelledby': plannedLabelledBy, ...controlAttributes } = range.ariaProps;
  // The `Slider` gives its `input` slot to every thumb, so a range of several values keeps the field's id, which only
  // one element may carry, on the slider's root, which a label's `for` can't name. Its label names a lone thumb through
  // `aria-labelledby` instead, while several thumbs each take that label's text and their number, to be told apart
  const labelId = getLabelId<T, S, F>(props);
  const labelledByLabel = isRangeOfValues && widgetDrawsLabelText<T, S, F>(props) ? labelId : undefined;
  const thumbText = plannedLabel || label;
  const namesEachThumb = isRangeOfValues && value.length > 1 && !authorNamesSlider && !!thumbText;
  const plannedName =
    authorNamesSlider || namesEachThumb
      ? {}
      : { 'aria-label': plannedLabel, 'aria-labelledby': plannedLabelledBy ?? labelledByLabel };
  const labelProps = isRangeOfValues ? { id: labelId } : { htmlFor: id };
  const rootProps = isRangeOfValues ? { id } : {};
  const thumbProps = isRangeOfValues ? {} : { id, autoFocus: range.autoFocus };

  return (
    <>
      {labelValue(
        <FormLabel required={required} {...labelProps}>
          {label || undefined}
        </FormLabel>,
        hideLabel,
      )}
      <Slider
        disabled={range.disabled}
        onChange={handleChange}
        onBlur={range.onBlur}
        onFocus={range.onFocus}
        valueLabelDisplay='auto'
        {...authorSlider}
        {...sliderProps}
        {...rootProps}
        // After the author's props, where a `getAriaLabel: undefined` would leave the thumbs no name. A translation left
        // empty numbers nothing, as it does for an array item's name
        getAriaLabel={
          namesEachThumb
            ? (index) =>
                registry.translateString(TranslatableString.ItemNameWithNumber, [thumbText, String(index + 1)]) ||
                thumbText
            : authorSlider.getAriaLabel
        }
        ref={rootRef}
        // The slider's root isn't focusable but its thumb's `<input>` is, so the input carries the field's id and plan
        slotProps={withInputSlot(
          { ...thumbProps, required, ...controlAttributes, ...plannedName },
          authorSlider.slotProps,
        )}
      />
    </>
  );
}
