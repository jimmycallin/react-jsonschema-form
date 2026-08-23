import type { FormContextType, RJSFSchema, UIOptionsType, WidgetProps } from '@rjsf/utils';
import { isUiSchema } from '@rjsf/utils';

/** The props of a primereact widget that renders a primereact input component. On top of the standard `WidgetProps`
 * these are the `type` and `onChangeOverride` extras that `BaseInputTemplateProps` documents, except that
 * `onChangeOverride` here takes the change event `E` of the primereact component being rendered rather than a DOM
 * `ChangeEvent`. Both extras arrive through the `WidgetProps` index signature, which types them as `unknown`, so they
 * are named here instead of being narrowed at each read site.
 */
export type PrimeWidgetProps<
  E,
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = WidgetProps<T, S, F> & {
  /** The optional HTML input `type` to render, overriding the one derived from the schema */
  type?: string;
  /** An optional handler that replaces the change handler this widget provides to the primereact component */
  onChangeOverride?: (event: E) => void;
};

/** The `ui:options` that the primereact theme itself understands. A `uiSchema` may carry any key, so `UIOptionsType`
 * types every value as `unknown`; this interface names the options this theme actually reads so that `getPrimeOptions()`
 * is the single place where that view of the options is taken.
 */
export interface PrimeUiOptions {
  /** Extra props that are spread directly onto the underlying primereact component */
  prime?: object;
  /** `InputNumber` options read by the `UpDownWidget` */
  showButtons?: boolean;
  buttonLayout?: 'horizontal' | 'vertical' | 'stacked';
  useGrouping?: boolean;
  minFractionDigits?: number;
  maxFractionDigits?: number;
  locale?: string;
  currency?: string;
  /** `ColorPicker` option read by the `ColorWidget` */
  inline?: boolean;
}

/** Views the given `ui:options` as the options the primereact theme reads.
 *
 * @param options - The `ui:options` for a widget or template
 * @returns The same object, viewed as the options this theme understands
 */
export function getPrimeOptions<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(options: UIOptionsType<T, S, F>): PrimeUiOptions {
  // One assertion here so that no read site needs one: these keys are this theme's documented options.
  return options as PrimeUiOptions;
}

/** Returns the extra props to spread onto the underlying primereact component, from the `prime` `ui:option`
 *
 * @param options - The `ui:options` for a widget or template
 * @returns The `prime` props, or an empty object when none were provided
 */
export function getPrimeProps<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(options: UIOptionsType<T, S, F>): object {
  return getPrimeOptions<T, S, F>(options).prime || {};
}

/** The grid options that the primereact `GridTemplate` reads out of the `ui:layoutGrid` of a `uiSchema` */
export interface PrimeLayoutGrid {
  /** The total number of columns in the grid */
  columns?: number | string;
  /** The CSS gap between the grid cells */
  gap?: number | string;
}

/** Views the `ui:layoutGrid` of the given `uiSchema` as the grid options the primereact `GridTemplate` reads. The
 * `uiSchema` arrives as `unknown` in the extra props of `GridTemplateProps`, so it is narrowed here rather than at the
 * read site.
 *
 * @param uiSchema - The potential `uiSchema` from the grid template props
 * @returns The grid options, empty when there is no `ui:layoutGrid`
 */
export function getPrimeLayoutGrid(uiSchema: unknown): PrimeLayoutGrid {
  const layoutGrid = isUiSchema(uiSchema) ? uiSchema['ui:layoutGrid'] : undefined;
  if (!isUiSchema(layoutGrid)) {
    return {};
  }
  const { columns, gap } = layoutGrid;
  return {
    columns: typeof columns === 'number' || typeof columns === 'string' ? columns : undefined,
    gap: typeof gap === 'number' || typeof gap === 'string' ? gap : undefined,
  };
}

export function Label({ id, text, required }: { id: string; text?: string; required?: boolean }) {
  if (!text) {
    return null;
  }

  return (
    <label htmlFor={id}>
      {text} {required ? '*' : ''}
    </label>
  );
}
