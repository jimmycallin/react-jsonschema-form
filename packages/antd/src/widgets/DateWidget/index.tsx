import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds } from '@rjsf/utils';
import { DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import { getAntdFormContext } from '../../utils';

const DATE_PICKER_STYLE = {
  width: '100%',
};

type DateWidgetProps<T, S extends RJSFSchema, F extends FormContextType> = WidgetProps<T, S, F> & {
  showTime?: boolean;
};

/** The `DateWidget` component uses the `BaseInputTemplate` changing the type to `date` and transforms
 * the value to undefined when it is falsy during the `onChange` handling.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function DateWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  disabled,
  registry,
  id,
  onBlur,
  onChange,
  onFocus,
  placeholder,
  readonly,
  value,
  showTime = false,
}: DateWidgetProps<T, S, F>) {
  const { formContext } = registry;
  const { readonlyAsDisabled = true } = getAntdFormContext(formContext);

  const handleChange = (nextValue: Dayjs | null) =>
    onChange(nextValue && (showTime ? nextValue.toISOString() : nextValue.format('YYYY-MM-DD')));

  const handleBlur = () => onBlur(id, value);

  const handleFocus = () => onFocus(id, value);

  const getPopupContainer = DateWidget.getPopupContainerCallback();

  return (
    <DatePicker
      disabled={disabled || (readonlyAsDisabled && readonly)}
      getPopupContainer={getPopupContainer}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      showTime={showTime}
      style={DATE_PICKER_STYLE}
      value={value && dayjs(value)}
      aria-describedby={ariaDescribedByIds(id)}
    />
  );
}

/** Give the playground a place to hook into the `getPopupContainer` callback generation function so that it can be
 * disabled while in the playground. Since the callback is a simple function, it can be returned by this static
 * "generator" function.
 */
// `parentNode` is typed as the more general `ParentNode`, but antd renders the popup into an element
DateWidget.getPopupContainerCallback = () => (node: HTMLElement) => node.parentNode as HTMLElement;
