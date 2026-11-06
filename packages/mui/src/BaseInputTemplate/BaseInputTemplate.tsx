import type { FormHelperTextProps } from '@mui/material/FormHelperText';
import type { InputProps as MuiInputProps } from '@mui/material/Input';
import InputAdornment from '@mui/material/InputAdornment';
import type { InputLabelProps as MuiInputLabelProps } from '@mui/material/InputLabel';
import type { TextFieldOwnerState, TextFieldProps } from '@mui/material/TextField';
import TextField from '@mui/material/TextField';
import { SchemaExamples } from '@rjsf/core';
import type {
  BaseInputTemplateProps,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { hasWidgetErrors, labelValue, useBaseInputProps, widgetDrawsLabel } from '@rjsf/utils';

import type { MuiSlotProps } from '../util.ts';
import { describeByHelperText, getMuiProps, helperTextSlot, inputLabelId, resolveSlotProps } from '../util.ts';

type HtmlInputAttributes = React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>;

/** Properties available for the MUI `ui:options` of the BaseInputTemplate.
 *  Unlike RJSF templates, `slotProps` here maps directly to MUI's native `TextField` `slotProps`,
 *  enabling type-safe customization of the underlying MUI sub-components. */
export interface BaseInputTemplateMuiProps extends GenericObjectType {
  /** Native MUI `TextField` slotProps for targeting specific sub-components. */
  slotProps?: {
    /** Props applied to the base native HTML `<input>` or `<textarea>` element, as an object or as MUI's
     * `(ownerState) => props` */
    htmlInput?: MuiSlotProps<HtmlInputAttributes, TextFieldOwnerState>;
    /** Props applied to the MUI `Input` element, useful for `endAdornment`/`startAdornment`. */
    input?: MuiInputProps;
    /** Props applied to the MUI `InputLabel` element. */
    inputLabel?: MuiInputLabelProps;
    /** Props applied to the helper text, as an object or as MUI's `(ownerState) => props`. */
    formHelperText?: MuiSlotProps<FormHelperTextProps, TextFieldOwnerState>;
  };
}

const TYPES_THAT_SHRINK_LABEL = ['date', 'datetime-local', 'file', 'time'];

/** The props mui's `BaseInputTemplate` takes: the shared `BaseInputTemplateProps`, and the `TextField` props that mui's
 * own widgets, or a custom widget, pass it through the registry's `BaseInputTemplate`, typed by reading that template as
 * a `SlotComponent<MuiBaseInputTemplateProps>`
 */
export type MuiBaseInputTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = BaseInputTemplateProps<T, S, F> &
  Pick<BaseInputTemplateMuiProps, 'slotProps'> &
  Partial<
    Omit<TextFieldProps, keyof BaseInputTemplateProps<T, S, F> | 'slotProps' | 'InputLabelProps' | 'InputProps'>
  > & {
    /** Props for MUI's `InputLabel`, under the name MUI's `TextField` once took them by */
    InputLabelProps?: Partial<MuiInputLabelProps>;
    /** Props for MUI's `Input`, under the name MUI's `TextField` once took them by */
    InputProps?: Partial<MuiInputProps>;
  };

/** The `BaseInputTemplate` is the template to use to render the basic `<input>` component for the `core` theme.
 * It is used as the template for rendering many of the <input> based widgets that differ by `type` and callbacks only.
 * It can be customized/overridden for other themes or individual implementations as needed.
 *
 * @param props - The `WidgetProps` for this template
 */
export default function BaseInputTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: MuiBaseInputTemplateProps<T, S, F>) {
  const {
    // The props the hook reads, kept out of `textFieldProps`
    id: _id,
    name: _name,
    htmlName: _htmlName,
    placeholder: _placeholder,
    required: _required,
    readonly: _readonly,
    disabled: _disabled,
    type,
    label,
    // oxlint-disable-next-line typescript/no-deprecated -- kept out of the props this spreads onto the element
    hideLabel: _hideLabel,
    hideError: _hideError,
    value: _value,
    onChange: _onChange,
    onChangeOverride,
    onBlur: _onBlur,
    onFocus: _onFocus,
    autofocus: _autofocus,
    options,
    schema,
    uiSchema: _uiSchema,
    // oxlint-disable-next-line typescript/no-deprecated -- kept out of the props this spreads onto the element
    rawErrors: _rawErrors,
    errorSchema: _errorSchema,
    registry,
    InputLabelProps,
    InputProps,
    slotProps,
    presentation: _presentation,
    // Attributes of the `<input>`, which `TextField` would otherwise put on its root
    pattern: _pattern,
    accept: _accept,
    inputMode: _inputMode,
    multiple: _multiple,
    ...textFieldProps
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const { ClearButton } = registry.templates.ButtonTemplates;
  const input = useBaseInputProps<T, S, F>(props);
  // Now we need to pull out the step, min, max into an inner `inputProps` for material-ui
  const { step, min, max, accept, inputMode, pattern, autoCapitalize, multiple, ...rest } = input.inputProps;

  const muiProps = getMuiProps<T, S, F, BaseInputTemplateMuiProps>(options);
  // `rjsfSlotProps` holds other elements' props, which would reach the input's DOM through the `TextField`
  const { slotProps: muiSlotProps, rjsfSlotProps: _otherSlots, ...otherMuiProps } = muiProps;

  const textFieldOverrides = { ...otherMuiProps, ...textFieldProps } as TextFieldProps;
  const textFieldId = textFieldOverrides.id ?? input.id;
  const controlAttributes = describeByHelperText(input.ariaProps, textFieldId, textFieldOverrides.helperText);
  // The derived attributes and the field's plan come first so a caller's `slotProps.htmlInput` overrides any of them.
  // The plan goes on the `<input>` a user focuses rather than on the `TextField`'s root, where its own props go. The
  // title explains the derived `pattern`, so a `pattern` in `htmlInput` drops it as a passed `pattern` does. A caller may give `htmlInput` as MUI's `(ownerState) => props`, so the slot is handed on in that
  // form, for MUI to resolve
  const htmlInputProps = (ownerState: TextFieldOwnerState) => {
    const callerHtmlInput = {
      ...resolveSlotProps<HtmlInputAttributes, TextFieldOwnerState>(slotProps?.htmlInput, ownerState),
      ...resolveSlotProps(muiSlotProps?.htmlInput, ownerState),
    };
    return {
      title: 'pattern' in callerHtmlInput ? undefined : input.title,
      step,
      min,
      max,
      accept,
      inputMode,
      pattern,
      autoCapitalize,
      multiple,
      ...controlAttributes,
      ...callerHtmlInput,
      ...(input.listId ? { list: input.listId } : undefined),
    };
  };
  const DisplayInputLabelProps = TYPES_THAT_SHRINK_LABEL.includes(type ?? '')
    ? { ...slotProps?.inputLabel, ...muiSlotProps?.inputLabel, ...InputLabelProps, shrink: true }
    : { ...slotProps?.inputLabel, ...muiSlotProps?.inputLabel, ...InputLabelProps };
  const inputProps = { ...InputProps, ...slotProps?.input, ...muiSlotProps?.input };
  if (input.showClearButton) {
    const clearAdornment = (
      <InputAdornment position='end'>
        <ClearButton registry={registry} onClick={input.onClear} />
      </InputAdornment>
    );
    inputProps.endAdornment = !inputProps.endAdornment ? (
      clearAdornment
    ) : (
      <>
        {inputProps.endAdornment}
        {clearAdornment}
      </>
    );
  }

  return (
    <>
      <TextField
        id={input.id}
        name={input.name}
        placeholder={input.placeholder}
        label={labelValue(label || undefined, hideLabel, undefined)}
        autoFocus={input.autoFocus}
        required={input.required}
        disabled={input.disabled || input.readOnly}
        slotProps={{
          ...slotProps,
          ...muiSlotProps,
          input: inputProps,
          htmlInput: htmlInputProps,
          inputLabel: { ...DisplayInputLabelProps, id: DisplayInputLabelProps.id ?? inputLabelId(textFieldId) },
          formHelperText: helperTextSlot<FormHelperTextProps, TextFieldOwnerState>(
            textFieldId,
            slotProps?.formHelperText,
            muiSlotProps?.formHelperText,
          ),
        }}
        {...rest}
        value={input.value}
        error={hasWidgetErrors<T, S, F>(props)}
        onChange={onChangeOverride ?? ((event) => input.onChange(event.target.value))}
        onBlur={input.onBlur}
        onFocus={input.onFocus}
        {...textFieldOverrides}
      />
      <SchemaExamples id={input.id} schema={schema} suggestions={input.exampleSuggestions} />
    </>
  );
}
