import type { InputLabelProps as MuiInputLabelProps } from '@mui/material/InputLabel';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import type { SelectProps as MuiSelectProps } from '@mui/material/Select';
import type { TextFieldProps } from '@mui/material/TextField';
import TextField from '@mui/material/TextField';
import type {
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  SelectWidgetOption,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { hasWidgetErrors, labelValue, SelectedOptionDescription, useSelectWidgetProps } from '@rjsf/utils';

import { describeByHelperText, getMuiProps, helperTextSlot, inputLabelId, withSlotProps } from '../util.ts';

/** Properties available for the `rjsfSlotProps` target of the SelectWidget. */
export interface SelectWidgetMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the SelectWidget. */
  rjsfSlotProps?: {
    /** Props applied to the `InputLabel` element. */
    inputLabel?: MuiInputLabelProps;
    /** Props applied to the `Select` element. */
    select?: MuiSelectProps;
    /** Props applied to the element with the `combobox` role, as an object or as MUI's `(ownerState) => props`. */
    htmlInput?: NonNullable<TextFieldProps['slotProps']>['htmlInput'];
    /** Props applied to the helper text, as an object or as MUI's `(ownerState) => props`. */
    formHelperText?: NonNullable<TextFieldProps['slotProps']>['formHelperText'];
  };
}

function renderOption({ index, value, disabled, label }: SelectWidgetOption) {
  return (
    <MenuItem key={index} value={value} disabled={disabled}>
      {label}
    </MenuItem>
  );
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
>(
  props: WidgetProps<T, S, F> & {
    /** Older MUI `TextField` props, kept off the `TextField` rather than spread on it */
    InputLabelProps?: unknown;
    /** Older MUI `TextField` props, kept off the `TextField` rather than spread on it */
    SelectProps?: unknown;
  },
) {
  const {
    schema: _schema,
    id,
    name: _name,
    htmlName: _htmlName,
    options,
    label,
    // oxlint-disable-next-line typescript/no-deprecated -- kept out of the props this spreads onto the element
    hideLabel: _hideLabel,
    required: _required,
    disabled: _disabled,
    placeholder,
    readonly: _readonly,
    value: _value,
    multiple,
    autofocus: _autofocus,
    onChange: _onChange,
    onBlur: _onBlur,
    onFocus: _onFocus,
    errorSchema: _errorSchema,
    // oxlint-disable-next-line typescript/no-deprecated -- kept out of the props this spreads onto the element
    rawErrors: _rawErrors,
    registry: _registry,
    uiSchema: _uiSchema,
    hideError: _hideError,
    // Given to the combobox below, so kept off the field's root, where `textFieldProps` are spread
    'aria-label': _ariaLabel,
    'aria-describedby': _ariaDescribedBy,
    presentation: _presentation,
    ...textFieldProps
  } = props;
  const select = useSelectWidgetProps<T, S, F>(props);
  const { rjsfSlotProps: muiSlotProps, ...otherMuiProps } = getMuiProps<T, S, F, SelectWidgetMuiProps>(options);

  const { InputLabelProps, SelectProps, autocomplete, ...textFieldRemainingProps } = textFieldProps;
  // MUI's select gives its `inputProps` to the element with the `combobox` role, rather than to the field's root. An
  // `htmlInput` given through `rjsfSlotProps` is the form author's own choice for that element, so it is applied last
  const textFieldOverrides = { ...otherMuiProps, ...textFieldRemainingProps } as TextFieldProps;
  const textFieldId = textFieldOverrides.id ?? id;
  const ariaProps = describeByHelperText(select.ariaProps, textFieldId, textFieldOverrides.helperText);
  const ownLabel = labelValue(label || undefined, select.descriptionProps.hideLabel, undefined);
  const textFieldLabel = 'label' in textFieldOverrides ? textFieldOverrides.label : ownLabel;
  const labelId = muiSlotProps?.inputLabel?.id ?? inputLabelId(textFieldId);

  return (
    <>
      <TextField
        id={select.id}
        name={select.name}
        label={ownLabel}
        value={select.value}
        required={select.required}
        disabled={select.disabled}
        autoFocus={select.autoFocus}
        autoComplete={autocomplete}
        placeholder={placeholder}
        error={hasWidgetErrors<T, S, F>(props)}
        onChange={(event) => select.onChange(event.target.value)}
        onBlur={select.onBlur}
        onFocus={select.onFocus}
        {...textFieldOverrides}
        select // Apply this and the following props after the potential overrides defined in textFieldProps
        slotProps={{
          ...muiSlotProps,
          inputLabel: {
            ...muiSlotProps?.inputLabel,
            // A multiple select shows a lone value as a one-item selection, so its label shrinks for whatever it shows
            shrink: select.value.length > 0,
            id: labelId,
          },
          select: {
            // MUI names the combobox by the `labelId` of its select, and gives an `aria-labelledby` among its
            // `inputProps` to the hidden native input instead, so a label the plan names it by goes there
            ...((ariaProps['aria-labelledby'] || textFieldLabel) && {
              labelId: ariaProps['aria-labelledby'] ?? labelId,
            }),
            ...muiSlotProps?.select,
            multiple,
          },
          htmlInput: withSlotProps(ariaProps, muiSlotProps?.htmlInput),
          formHelperText: helperTextSlot(textFieldId, muiSlotProps?.formHelperText),
        }}
      >
        {select.showPlaceholderOption && <MenuItem value=''>{placeholder}</MenuItem>}
        {select.groupedOptions.flatMap((item) =>
          'options' in item
            ? [
                // MUI's `SelectInput` clones every direct child with `role='option'` and has no group primitive, so a
                // heading can't be exposed as a `role='group'` label the way a native `<optgroup>` is. `aria-disabled`
                // is the closest available: the label is still announced, but not as something selectable (clicking it
                // is already a no-op, since `handleItemClick` bails on the missing `tabindex`).
                <ListSubheader key={`optgroup-${item.label}`} aria-disabled>
                  {item.label}
                </ListSubheader>,
                ...item.options.map(renderOption),
              ]
            : [renderOption(item)],
        )}
      </TextField>
      <SelectedOptionDescription {...select.descriptionProps} />
    </>
  );
}
