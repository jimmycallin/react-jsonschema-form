import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { joinClassNames, useRadioWidgetProps } from '@rjsf/utils';

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
function RadioWidget<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: WidgetProps<T, S, F>,
) {
  const { classMap } = props.registry;
  const radio = useRadioWidgetProps<T, S, F>(props);

  return (
    <div className='rjsf-field-radio-group' id={radio.id} {...radio.groupProps}>
      {radio.options.map((option) => {
        const optionDisabled = radio.disabled || option.disabled;
        const disabledCls = optionDisabled && classMap.disabled;
        const control = (
          <span>
            <input
              type='radio'
              className={classMap.radioInput}
              id={option.id}
              checked={option.checked}
              name={radio.name}
              required={radio.required}
              value={option.value}
              disabled={optionDisabled}
              autoFocus={option.autoFocus}
              onChange={() => radio.onChange(option.value)}
              onBlur={option.onBlur}
              onFocus={option.onFocus}
              {...radio.optionProps}
            />
            <span>{option.label}</span>
          </span>
        );

        return radio.inline ? (
          <label
            key={option.index}
            className={joinClassNames('rjsf-radio-inline', classMap.radioInlineLabel, disabledCls)}
            data-disabled={optionDisabled || undefined}
          >
            {control}
          </label>
        ) : (
          <div
            key={option.index}
            className={joinClassNames('rjsf-radio', classMap.radioWrapper, disabledCls)}
            data-disabled={optionDisabled || undefined}
          >
            <label className={classMap.radioLabel}>{control}</label>
          </div>
        );
      })}
    </div>
  );
}

export default RadioWidget;
