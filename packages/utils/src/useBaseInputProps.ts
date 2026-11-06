'use client';

import { useCallback } from 'react';

import getBaseInputProps from './getBaseInputProps.ts';
import getControlAttributes from './getControlAttributes.ts';
import getExampleSuggestions from './getExampleSuggestions.ts';
import { examplesId } from './idGenerators.ts';
import offersClearButton from './offersClearButton.ts';
import toInputValue from './toInputValue.ts';
import type {
  BaseInputTemplateProps,
  ControlAttributes,
  FormContextType,
  InputPropsType,
  RJSFSchema,
  StrictRJSFSchema,
} from './types.ts';
import useSelectFocusHandlers from './useSelectFocusHandlers.ts';

/** An event whose default and propagation a clear button's click stops, so the click neither submits the form the
 * button sits in nor reaches a label wrapping it
 */
export interface ClearEvent {
  preventDefault(): void;
  stopPropagation(): void;
}

export interface UseBaseInputPropsResult {
  /** The input's id */
  id: string;
  /** The input's name, for a native form submission */
  name: string;
  /** Whether the field is required */
  required: boolean | undefined;
  /** Whether the field is disabled */
  disabled: boolean;
  /** Whether the field is read-only, which leaves its input focusable but unchangeable */
  readOnly: boolean;
  /** Whether the input takes focus when it mounts */
  autoFocus: boolean;
  /** The text shown while the input is empty */
  placeholder: string | undefined;
  /** The form data as the string or number an input shows, `''` where it holds none */
  value: string | number;
  /** The input's `type`, `step`, `min`, `max`, `accept`, `autoComplete` and the other attributes the schema and
   * `ui:options` give it, with `multiple` for a file input
   */
  inputProps: InputPropsType & { multiple?: boolean };
  /** The input's `title`, which says what a numeric input accepts */
  title: string | undefined;
  /** The id of the `<datalist>` of the schema's `examples` for the input's `list`, or `undefined` where it has none */
  listId: string | undefined;
  /** The schema's `examples` and `default`, as the strings the datalist suggests */
  exampleSuggestions: readonly string[];
  /** The input's `aria-*` attributes, describing it by the datalist too where it has one */
  ariaProps: Omit<ControlAttributes, 'required'>;
  /** Whether to draw a clear button: `ui:options.allowClearTextInputs` asks for one, the field is enabled and
   * changeable, and the input shows a value
   */
  showClearButton: boolean;
  /** Reports a new value: an empty one, `''`, `null` or `undefined`, as `ui:emptyValue`, and anything else as it is.
   * It reports nothing while the field is disabled or read-only
   */
  onChange: (value: unknown) => void;
  /** Empties the field to `ui:emptyValue`, stopping the clear button's click from going further */
  onClear: (event?: ClearEvent) => void;
  /** Reports the form data to `onFocus`. It takes no argument, so it can be handed to any control's focus event */
  onFocus: () => void;
  /** Reports the form data to `onBlur`. It takes no argument, so it can be handed to any control's blur event */
  onBlur: () => void;
}

/** Hook which holds what every `BaseInputTemplate` does whatever its UI library: it shows the form data as the input's
 * string, derives the input's `type` and attributes from the schema and `ui:options`, reports an emptied input as
 * `ui:emptyValue`, decides whether a clear button is drawn, lists the schema's `examples` for a datalist, and supplies
 * the input's id, name and `aria-*` attributes. Its change and clear handlers report nothing while the field is
 * disabled or read-only. To be used by theme specific `BaseInputTemplate` and `TextareaWidget` implementations, and by
 * an app's own.
 *
 * @param props - The `BaseInputTemplateProps` for the `BaseInputTemplate`
 * @param [plainNativeInput=true] - Whether the input is a plain native one, which takes a `step` of `'any'`, rather than
 *        a library's numeric input
 * @returns - The `UseBaseInputPropsResult` to be used within a `BaseInputTemplate` implementation
 */
export default function useBaseInputProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: BaseInputTemplateProps<T, S, F>, plainNativeInput = true): UseBaseInputPropsResult {
  const {
    id,
    htmlName,
    schema,
    options,
    value,
    required,
    disabled = false,
    readonly = false,
    autofocus = false,
    placeholder,
    onChange,
    onFocus,
    onBlur,
    presentation,
  } = props;
  const { emptyValue, allowClearTextInputs } = options;
  const inactive = disabled || readonly;
  const { title, ...inputProps } = getBaseInputProps<T, S, F>(props, plainNativeInput);
  const inputValue = toInputValue(value);
  const exampleSuggestions = getExampleSuggestions<S>(schema);
  const listId = exampleSuggestions.length > 0 ? examplesId(id) : undefined;

  const handleChange = useCallback(
    (next: unknown) => {
      if (!inactive) {
        onChange(next === '' || next === null || next === undefined ? emptyValue : next);
      }
    },
    [inactive, onChange, emptyValue],
  );
  const handleClear = useCallback(
    (event?: ClearEvent) => {
      event?.preventDefault();
      event?.stopPropagation();
      if (!inactive) {
        onChange(emptyValue);
      }
    },
    [inactive, onChange, emptyValue],
  );
  // A read-only input still takes focus, so only a disabled one, which can't, reports none
  const { handleFocus, handleBlur } = useSelectFocusHandlers<T, S, F>(
    { id, value, options, onFocus, onBlur },
    disabled,
  );

  return {
    id,
    name: htmlName || id,
    required,
    disabled,
    readOnly: readonly,
    autoFocus: autofocus,
    placeholder,
    value: inputValue,
    inputProps,
    title,
    listId,
    exampleSuggestions,
    ariaProps: getControlAttributes<T, S, F>({ id, presentation }, listId ? [listId] : []),
    showClearButton: Boolean(allowClearTextInputs) && !inactive && offersClearButton(inputValue, inputProps.type),
    onChange: handleChange,
    onClear: handleClear,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };
}
