import type { FormContextType, WidgetProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { joinClassNames, useCheckboxesWidgetProps } from '@rjsf/utils';

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
function CheckboxesWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { classMap } = props.registry;
  const checkboxes = useCheckboxesWidgetProps<T, S, F>(props);

  return (
    <div className='rjsf-checkboxes' id={checkboxes.id} {...checkboxes.groupProps}>
      {checkboxes.options.map((option) => {
        const optionDisabled = checkboxes.disabled || option.disabled;
        const disabledCls = optionDisabled && classMap.disabled;
        const checkbox = (
          <span>
            <input
              type='checkbox'
              className={classMap.checkboxInput}
              id={option.id}
              name={checkboxes.name}
              checked={option.checked}
              value={option.value}
              disabled={optionDisabled}
              autoFocus={option.autoFocus}
              onChange={(event) => option.onCheckedChange(event.target.checked)}
              onBlur={option.onBlur}
              onFocus={option.onFocus}
              {...checkboxes.optionProps}
            />
            <span>{option.label}</span>
          </span>
        );
        return checkboxes.inline ? (
          <label
            key={option.index}
            className={joinClassNames('rjsf-checkbox-inline', classMap.checkboxInlineLabel, disabledCls)}
            data-disabled={optionDisabled || undefined}
          >
            {checkbox}
          </label>
        ) : (
          <div
            key={option.index}
            className={joinClassNames('rjsf-checkbox', classMap.checkboxWrapper, disabledCls)}
            data-disabled={optionDisabled || undefined}
          >
            <label className={classMap.checkboxLabel}>{checkbox}</label>
          </div>
        );
      })}
    </div>
  );
}

export default CheckboxesWidget;
