import type { FormContextType, RJSFSchema, StrictRJSFSchema, WrapIfAdditionalTemplateProps } from '@rjsf/utils';
import { AdditionalPropertyKeySelect, joinClassNames, useWrapIfAdditionalProps } from '@rjsf/utils';

import Label from './FieldTemplate/Label.tsx';

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to rename, or remove properties that are
 * part of an `additionalProperties` part of a schema. The key, the value and the remove button sit in a row that
 * `rjsf.css` lays out as a grid, on whose rows the key's label and input line up with the value's label and control.
 *
 * @param props - The `WrapIfAdditionalProps` for this component
 */
export default function WrapIfAdditionalTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
  const { classNames, style, hasErrors, keyName, required, children, registry } = props;
  const {
    additional,
    keyId,
    keyLabel,
    hasKeyLabel,
    keyErrorAttributes,
    keyInputProps,
    keySelectProps,
    removeButtonProps,
  } = useWrapIfAdditionalProps<T, S, F>(props);
  const { templates, classMap } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;

  if (!additional) {
    return (
      <div className={classNames} style={style} data-invalid={hasErrors || undefined}>
        {children}
      </div>
    );
  }
  return (
    <div className={classNames} style={style} data-invalid={hasErrors || undefined}>
      <div className='rjsf-additional-property'>
        <div className='rjsf-additional-property-key'>
          {hasKeyLabel && (
            <Label
              label={keyLabel}
              required={required}
              id={keyId}
              className={joinClassNames('rjsf-field-label', classMap.fieldLabel)}
              invalid={keyErrorAttributes['aria-invalid']}
            />
          )}
          {keySelectProps ? (
            <AdditionalPropertyKeySelect<T, S, F> {...keySelectProps} />
          ) : (
            <input key={keyName} className={classMap.input} {...keyInputProps} />
          )}
        </div>
        <div className='rjsf-additional-property-value'>{children}</div>
        <RemoveButton {...removeButtonProps} />
      </div>
    </div>
  );
}
