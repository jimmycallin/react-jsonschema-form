import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { useRadioWidgetProps } from '@rjsf/utils';
import { Radio } from 'antd';

import useControlState from '../../controlState.ts';

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RadioWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { disabled, readonly, required, registry } = props;
  const control = useControlState<T, S, F>({ disabled, readonly, required, registry });
  const radio = useRadioWidgetProps<T, S, F>(props);

  return (
    <Radio.Group
      id={radio.id}
      name={radio.name}
      onChange={(event) => radio.onChange(event.target.value)}
      // Controlled even with no value, so a click on a read-only group, which `readonlyAsDisabled: false` leaves
      // enabled, checks nothing the form doesn't hold
      value={radio.value || null}
      {...radio.groupProps}
      aria-readonly={control.ariaReadonly}
    >
      {radio.options.map((option) => (
        <Radio
          id={option.id}
          name={radio.name}
          autoFocus={option.autoFocus}
          // `undefined` rather than `false` for an enabled option, since antd reads its `DisabledContext` only when
          // the radio leaves `disabled` unset
          disabled={control.disabled || option.disabled || undefined}
          key={option.index}
          required={control.toggleRequired}
          value={option.value}
          onBlur={option.onBlur}
          onFocus={option.onFocus}
          {...radio.optionProps}
        >
          {option.label}
        </Radio>
      ))}
    </Radio.Group>
  );
}
