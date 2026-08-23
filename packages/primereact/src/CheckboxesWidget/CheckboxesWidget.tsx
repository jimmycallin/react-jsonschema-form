import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionsDeselectValue,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  optionId,
  descriptionId,
  getTemplate,
} from '@rjsf/utils';
import type { CheckboxChangeEvent } from 'primereact/checkbox';
import { Checkbox } from 'primereact/checkbox';

import { Label, getPrimeProps } from '../util';

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T = unknown,
  S extends RJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    disabled,
    options,
    value,
    autofocus,
    readonly,
    onChange,
    onBlur,
    onFocus,
    schema,
    uiSchema,
    registry,
    hideLabel,
  } = props;
  const { enumOptions, enumDisabled } = options;
  const primeProps = getPrimeProps<T, S, F>(options);
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const handleChange = (index: number) => (e: CheckboxChangeEvent) => {
    if (e.checked) {
      onChange(enumOptionsSelectValue<S>(index, checkboxesValues, enumOptions));
    } else {
      onChange(enumOptionsDeselectValue<S>(index, checkboxesValues, enumOptions));
    }
  };

  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options,
  );

  const handleBlur = () => onBlur(id, value);
  const handleFocus = () => onFocus(id, value);

  const description = options.description ?? schema.description;

  return (
    <div
      id={id}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}
    >
      {!hideLabel && !!description && (
        <DescriptionFieldTemplate
          id={descriptionId(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index) => {
          const checked = enumOptionsIsSelected<S>(option.value, checkboxesValues);
          const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(option.value);
          return (
            <div
              key={String(option.value)}
              style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}
            >
              <Checkbox
                inputId={optionId(id, index)}
                name={htmlName || id}
                {...primeProps}
                value={option.value}
                checked={checked}
                disabled={disabled || itemDisabled || readonly}
                autoFocus={autofocus && index === 0}
                onChange={handleChange(index)}
                onBlur={handleBlur}
                onFocus={handleFocus}
                aria-describedby={ariaDescribedByIds(id)}
              />
              <Label id={optionId(id, index)} text={option.label} />
            </div>
          );
        })}
    </div>
  );
}
