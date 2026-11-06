import type { ReactElement } from 'react';
import { Checkbox } from '@mantine/core';
import type { StrictRJSFSchema, RJSFSchema, FormContextType, WidgetProps } from '@rjsf/utils';
import { getErrorsToDraw, hasWidgetErrors, labelValue, useCheckboxWidgetProps } from '@rjsf/utils';

import { getDescriptionProps, renderErrors } from '../utils.tsx';

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>): ReactElement {
  const { id, label } = props;
  const checkbox = useCheckboxWidgetProps<T, S, F>(props);
  const hideLabel = !checkbox.drawsLabel;

  const { description } = getDescriptionProps(props);
  const errors = getErrorsToDraw<T, S, F>(props);
  const invalid = hasWidgetErrors<T, S, F>(props);
  return (
    <>
      {description}
      <Checkbox
        id={checkbox.id}
        name={checkbox.name}
        label={
          !hideLabel && label ? (
            <>
              {label}
              {checkbox.required && <span className='required'>*</span>}
            </>
          ) : (
            labelValue(label || undefined, hideLabel, false)
          )
        }
        disabled={checkbox.disabled}
        required={checkbox.required}
        autoFocus={checkbox.autoFocus}
        checked={checkbox.checked}
        onChange={(event) => checkbox.onChange(event.currentTarget.checked)}
        onBlur={checkbox.onBlur}
        onFocus={checkbox.onFocus}
        // Mantine's `Checkbox` would render a message as its own error, with an id derived from the input's rather than
        // `errorId(id)`, so it only gets a boolean, for the error styling, and the errors are rendered below it. It
        // doesn't set `aria-invalid` either.
        error={invalid}
        {...checkbox.ariaProps}
        aria-invalid={invalid || undefined}
      />
      {renderErrors(id, errors, { mt: 'calc(var(--mantine-spacing-xs) / 2)' })}
    </>
  );
}
