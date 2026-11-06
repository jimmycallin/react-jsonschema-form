import getTemplates from './getTemplates.ts';
import getUiOptions from './getUiOptions.ts';
import templateDrawsLabel from './templateDrawsLabel.ts';
import templateDrawsPlannedLabel from './templateDrawsPlannedLabel.ts';
import templateLabelFor from './templateLabelFor.ts';
import templateMarksRequired from './templateMarksRequired.ts';
import type {
  FieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TemplatesType,
  UIOptionsType,
  WrapIfAdditionalTemplateProps,
} from './types.ts';

/** What a theme's widgets draw themselves */
export interface UseFieldTemplatePropsOptions {
  /** Whether the theme's widgets draw the field's label themselves where no plan says who draws it, as those of a UI
   * library whose controls carry their own label do. Its template then draws no label without a plan, which would repeat
   * the widget's. Otherwise a template without a plan draws the label `displayLabel` asks for, except for a field whose
   * `ui:widget` is the `checkbox` alias, which draws its own
   */
  widgetsDrawLabels?: boolean;
}

/** The props of the label a `FieldTemplate` draws */
export interface FieldTemplateLabelProps {
  /** The label's text */
  label: string;
  /** The id the plan gives the label's text, through which a group or an option selector is named */
  id: string | undefined;
  /** The control the label is for, which is none for a group named through `aria-labelledby` */
  htmlFor: string | undefined;
  /** Whether the label carries the required marker */
  required: boolean;
}

export interface UseFieldTemplatePropsResult<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** Whether the field is hidden, so the template draws its `children` alone, in an element that isn't displayed */
  hidden: boolean;
  /** The field's ui options, over the form's `ui:globalOptions` */
  uiOptions: UIOptionsType<T, S, F>;
  /** The `WrapIfAdditionalTemplate` the field's uiSchema or the registry names */
  WrapIfAdditionalTemplate: TemplatesType<T, S, F>['WrapIfAdditionalTemplate'];
  /** The props to hand the `WrapIfAdditionalTemplate`, with the template's own parts as its `children` */
  wrapProps: Omit<WrapIfAdditionalTemplateProps<T, S, F>, 'children'>;
  /** Whether the template draws the field's label */
  drawsLabel: boolean;
  /** The props of the label the template draws */
  labelProps: FieldTemplateLabelProps;
}

/** Hook which holds what every `FieldTemplate` does whatever its UI library: it says whether the field is hidden and
 * whether the template draws its label, supplies that label's props, and gathers the props of the
 * `WrapIfAdditionalTemplate` around the field, which it looks up from the field's ui options. To be used by theme
 * specific `FieldTemplate` implementations, and by an app's own.
 *
 * @param props - The `FieldTemplateProps` for the `FieldTemplate`
 * @param [options={}] - What the theme's widgets draw themselves
 * @returns - The `UseFieldTemplatePropsResult` to be used within a `FieldTemplate` implementation
 */
export default function useFieldTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldTemplateProps<T, S, F>, options: UseFieldTemplatePropsOptions = {}): UseFieldTemplatePropsResult<T, S, F> {
  const {
    id,
    classNames,
    style,
    label,
    keyName,
    rawDescription,
    hidden = false,
    required,
    readonly,
    disabled,
    hideError,
    hasErrors,
    presentation,
    schema,
    uiSchema,
    registry,
    onKeyRename,
    onKeyRenameBlur,
    onRemoveProperty,
    propertyNamesEnum,
    keyNotAllowed,
  } = props;
  const { widgetsDrawLabels = false } = options;
  const uiOptions = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);
  const { WrapIfAdditionalTemplate } = getTemplates<T, S, F>(registry, uiOptions);
  let drawsLabel: boolean;
  if (presentation || widgetsDrawLabels) {
    drawsLabel = templateDrawsPlannedLabel<T, S, F>(props);
  } else {
    // A `checkbox` draws its own label; without a plan the alias is the only sign of one
    drawsLabel = templateDrawsLabel<T, S, F>(props) && !!label && uiOptions.widget !== 'checkbox';
  }

  return {
    hidden,
    uiOptions,
    WrapIfAdditionalTemplate,
    wrapProps: {
      id,
      classNames,
      style,
      label,
      keyName,
      rawDescription,
      // oxlint-disable-next-line typescript/no-deprecated -- handed on to a `WrapIfAdditionalTemplate` rendered without a plan, which labels the key by it
      displayLabel: props.displayLabel,
      // oxlint-disable-next-line typescript/no-deprecated -- handed on to a `WrapIfAdditionalTemplate` that still reads it
      rawErrors: props.rawErrors,
      required,
      readonly,
      disabled,
      hideError,
      hasErrors,
      presentation,
      schema,
      uiSchema,
      registry,
      onKeyRename,
      onKeyRenameBlur,
      onRemoveProperty,
      propertyNamesEnum,
      keyNotAllowed,
    },
    drawsLabel,
    labelProps: {
      label,
      id: presentation?.label.id,
      htmlFor: templateLabelFor<T, S, F>(props),
      required: templateMarksRequired<T, S, F>(props),
    },
  };
}
