import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, descriptionId, getTemplate, labelValue, schemaRequiresTrueValue } from '@rjsf/utils';
import type { CheckboxChangeEvent } from 'primereact/checkbox';
import { Checkbox } from 'primereact/checkbox';

import { Label, getPrimeProps } from '../util';

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    value,
    disabled,
    readonly,
    label,
    hideLabel,
    autofocus,
    onChange,
    onBlur,
    options,
    onFocus,
    schema,
    uiSchema,
    registry,
  } = props;

  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options,
  );

  const required = schemaRequiresTrueValue<S>(schema);
  const checked = value === 'true' || value === true;
  const handleChange = (e: CheckboxChangeEvent) => onChange?.(e.checked);
  const handleBlur: React.FocusEventHandler<HTMLInputElement> = () => onBlur?.(id, value);
  const handleFocus: React.FocusEventHandler<HTMLInputElement> = () => onFocus?.(id, value);
  const description = options.description ?? schema.description;
  const primeProps = getPrimeProps<T, S, F>(options);

  return (
    <>
      {!hideLabel && !!description && (
        <DescriptionFieldTemplate
          id={descriptionId(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
        <Checkbox
          inputId={id}
          name={htmlName || id}
          {...primeProps}
          disabled={disabled || readonly}
          autoFocus={autofocus}
          checked={typeof value === 'undefined' ? false : checked}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          required={required}
          aria-describedby={ariaDescribedByIds(id)}
        />
        {labelValue(<Label id={id} text={label} />, hideLabel, false)}
      </div>
    </>
  );
}
