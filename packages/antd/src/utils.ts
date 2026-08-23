import type { CSSProperties } from 'react';
import type { EnumOptionsType, FormContextType } from '@rjsf/utils';
import type { ColProps, FormProps, RowProps } from 'antd';

/** The options that the antd theme reads out of the `formContext`. This is the theme's `formContext` contract: any
 * other keys a user puts there are passed through untouched, but these are the ones antd's templates and widgets look
 * at, so they are the ones that get a type here.
 */
export interface AntdFormContext {
  /** Whether to render the colon after a `Form.Item` label, defaults to `true` in the `TitleField` */
  colon?: boolean;
  /** The span, or per-widget/field/type map of spans, used for each property of an object */
  colSpan?: number | Record<string, number | undefined>;
  /** Where a field's description is rendered, either as a tooltip or below the field (the default) */
  descriptionLocation?: 'tooltip' | 'below';
  /** The alignment of a `Form.Item` label */
  labelAlign?: FormProps['labelAlign'];
  /** The `Col` props used for the label part of a `Form.Item` */
  labelCol?: ColProps;
  /** When true (the default), a readonly field is rendered as a disabled antd control */
  readonlyAsDisabled?: boolean;
  /** The gutter used by every antd `Row` the theme renders, defaults to 24 */
  rowGutter?: RowProps['gutter'];
  /** The vertical alignment of the array/additional-properties toolbar row */
  toolbarAlign?: RowProps['align'];
  /** The `Col` props used for the control part of a `Form.Item` */
  wrapperCol?: ColProps;
  /** Extra styling for a `Form.Item` */
  wrapperStyle?: CSSProperties;
}

/** Views the `formContext` as the set of options the antd theme supports. `FormContextType` is an untyped bag of
 * `unknown` values, so this is the one place where the theme's assumptions about what lives in it are stated, rather
 * than asserting a type at each of the ~30 places an option is read.
 *
 * @param formContext - The `formContext` from the `registry`
 * @returns The `formContext` viewed as the antd theme's options
 */
export function getAntdFormContext<F extends FormContextType = FormContextType>(formContext: F): AntdFormContext {
  return formContext as AntdFormContext;
}

/** Narrows the `emptyValue` of an enum-backed widget to what the enum option helpers accept for a select-like control.
 * A schema `default`/`ui:emptyValue` can be any JSON value, but only strings can round-trip through the DOM `value` of
 * a select or radio group, so anything else is treated as "no empty value".
 *
 * @param emptyValue - The `emptyValue` from the widget `options`
 * @returns The `emptyValue` when it is usable as a DOM value, otherwise undefined
 */
export function selectEmptyValue(emptyValue: EnumOptionsType['value']): string | string[] | undefined {
  if (typeof emptyValue === 'string') {
    return emptyValue;
  }
  if (Array.isArray(emptyValue) && emptyValue.every((value) => typeof value === 'string')) {
    return emptyValue;
  }
  return undefined;
}
