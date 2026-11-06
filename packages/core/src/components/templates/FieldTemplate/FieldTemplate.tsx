import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { joinClassNames, templateDrawsDescription, useFieldTemplateProps } from '@rjsf/utils';

import Label from './Label.tsx';

/** The `FieldTemplate` component is the template used by `SchemaField` to render any field. It renders the field
 * content, (label, description, children, errors and help) inside of a `WrapIfAdditional` component.
 *
 * @param props - The `FieldTemplateProps` for this component
 */
export default function FieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldTemplateProps<T, S, F>) {
  const { children, errors, help, description, hasErrors, registry } = props;
  const { hidden, WrapIfAdditionalTemplate, wrapProps, drawsLabel, labelProps } = useFieldTemplateProps<T, S, F>(props);
  if (hidden) {
    return <div hidden>{children}</div>;
  }
  return (
    <WrapIfAdditionalTemplate {...wrapProps}>
      {drawsLabel && (
        <Label
          label={labelProps.label}
          required={labelProps.required}
          id={labelProps.htmlFor}
          labelId={labelProps.id}
          className={joinClassNames('rjsf-field-label', registry.classMap.fieldLabel)}
          invalid={hasErrors}
        />
      )}
      {templateDrawsDescription<T, S, F>(props) && description}
      {children}
      {errors}
      {help}
    </WrapIfAdditionalTemplate>
  );
}
