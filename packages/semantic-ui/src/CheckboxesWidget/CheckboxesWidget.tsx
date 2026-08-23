import type { FormEvent } from 'react';
import type { FormContextType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionsDeselectValue,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  getTemplate,
  optionId,
  titleId,
} from '@rjsf/utils';
import type { CheckboxProps } from 'semantic-ui-react';
import { Form } from 'semantic-ui-react';

import { getSemanticProps } from '../util';

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
    label,
    hideLabel,
    onChange,
    onBlur,
    onFocus,
    schema,
    uiSchema,
    rawErrors = [],
    registry,
  } = props;
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>('TitleFieldTemplate', registry, options);
  const { enumOptions, enumDisabled, inline } = options;
  const checkboxesValues = Array.isArray(value) ? value : [value];
  const semanticProps = getSemanticProps<T, S, F>({
    options,
    formContext: registry.formContext,
    uiSchema,
    defaultSchemaProps: {
      inverted: 'false',
    },
  });
  const handleChange =
    (index: number) =>
    (_event: FormEvent<HTMLInputElement>, { checked }: CheckboxProps) => {
      // oxlint-disable-next-line no-shadow
      if (checked) {
        onChange(enumOptionsSelectValue<S>(index, checkboxesValues, enumOptions));
      } else {
        onChange(enumOptionsDeselectValue<S>(index, checkboxesValues, enumOptions));
      }
    };

  const handleBlur = () => onBlur(id, value);
  const handleFocus = () => onFocus(id, value);
  const inlineOption = inline ? { inline: true } : { grouped: true };
  return (
    <>
      {!hideLabel && !!label && (
        <TitleFieldTemplate id={titleId(id)} title={label} schema={schema} uiSchema={uiSchema} registry={registry} />
      )}
      <Form.Group id={id} name={htmlName || id} {...inlineOption}>
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index) => {
            const checked = enumOptionsIsSelected<S>(option.value, checkboxesValues);
            const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(option.value);
            return (
              <Form.Checkbox
                id={optionId(id, index)}
                name={htmlName || id}
                key={String(option.value)}
                label={option.label}
                {...semanticProps}
                checked={checked}
                error={rawErrors.length > 0}
                disabled={disabled || itemDisabled || readonly}
                autoFocus={autofocus && index === 0}
                onChange={handleChange(index)}
                onBlur={handleBlur}
                onFocus={handleFocus}
                aria-describedby={ariaDescribedByIds(id)}
              />
            );
          })}
      </Form.Group>
    </>
  );
}
