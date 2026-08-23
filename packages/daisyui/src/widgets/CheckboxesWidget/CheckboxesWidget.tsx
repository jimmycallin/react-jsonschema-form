import type { FocusEvent } from 'react';
import { useCallback } from 'react';
import type { EnumOptionsType, WidgetProps, RJSFSchema, FormContextType } from '@rjsf/utils';
import { enumOptionValueDecoder, enumOptionValueEncoder, getOptionValueFormat, isObject } from '@rjsf/utils';

/** The `CheckboxesWidget` component renders a set of checkboxes for multiple choice selection
 * with DaisyUI styling.
 *
 * Features:
 * - Supports both primitive values and objects in enum options
 * - Handles array values with proper state management
 * - Uses DaisyUI checkbox styling with accessible labels
 * - Supports disabled and readonly states
 * - Provides focus and blur event handling for accessibility
 * - Uses vertical layout for better spacing and readability
 * - Uses memoized handlers for optimal performance
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ id, htmlName, disabled, options, value, readonly, required, onChange, onFocus, onBlur }: WidgetProps<T, S, F>) {
  const { enumOptions, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const isEnumeratedObject = enumOptions && enumOptions[0]?.value && typeof enumOptions[0].value === 'object';

  /** Determines if a checkbox option should be checked based on the current value
   *
   * @param option - The option to check
   * @returns Whether the option should be checked
   */
  const isChecked = useCallback(
    (option: EnumOptionsType<S>) => {
      if (!Array.isArray(value)) {
        return false;
      }
      const optionObject = isObject(option.value) ? option.value : undefined;
      if (isEnumeratedObject && optionObject) {
        return value.some((v) => isObject(v) && v.name === optionObject.name);
      }
      return value.includes(option.value);
    },
    [value, isEnumeratedObject],
  );

  /** Handles changes to a checkbox's checked state */
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const index = Number(event.target.dataset.index);
      const option = enumOptions?.[index];
      if (!option) {
        return;
      }

      const newValue = Array.isArray(value) ? [...value] : [];
      const optionValue = option.value;

      if (isChecked(option)) {
        // An "enumerated object" option is matched on its `name`; anything else is matched by identity
        const optionObject = isEnumeratedObject && isObject(optionValue) ? optionValue : undefined;
        onChange(
          newValue.filter((v) => (optionObject ? !isObject(v) || v.name !== optionObject.name : v !== optionValue)),
        );
      } else {
        onChange([...newValue, optionValue]);
      }
    },
    [onChange, value, isChecked, isEnumeratedObject, enumOptions],
  );

  /** Handles focus events for accessibility */
  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, enumOptionValueDecoder<S>(event.target.value, enumOptions, optionValueFormat, emptyValue));
      }
    },
    [onFocus, id, enumOptions, optionValueFormat, emptyValue],
  );

  /** Handles blur events for accessibility */
  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(id, enumOptionValueDecoder<S>(event.target.value, enumOptions, optionValueFormat, emptyValue));
      }
    },
    [onBlur, id, enumOptions, optionValueFormat, emptyValue],
  );

  return (
    <div className='form-control'>
      {/* Use a vertical layout with proper spacing */}
      <div className='flex flex-col gap-2 mt-1'>
        {enumOptions?.map((option, index) => (
          <label key={String(option.value)} className='flex items-center cursor-pointer gap-2'>
            <input
              type='checkbox'
              id={`${id}-${option.value}`}
              className='checkbox'
              name={htmlName || id}
              value={enumOptionValueEncoder(option.value, index, optionValueFormat)}
              checked={isChecked(option)}
              required={required}
              disabled={disabled || readonly}
              data-index={index}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            <span className='label-text'>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
