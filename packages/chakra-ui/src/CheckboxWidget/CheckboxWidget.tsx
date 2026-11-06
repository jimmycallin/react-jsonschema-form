import { Field as ChakraField, Text } from '@chakra-ui/react';
import type { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import {
  getTemplates,
  getUiOptions,
  getWidgetDescription,
  hasWidgetErrors,
  useCheckboxWidgetProps,
  widgetDrawsLabelText,
} from '@rjsf/utils';

import { Checkbox } from '../components/ui/checkbox.tsx';
import { Field } from '../components/ui/field.tsx';
import { getChakra, labelledByOrNone } from '../utils.ts';

export default function CheckboxWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { label, presentation, registry, options, uiSchema, schema } = props;
  const checkbox = useCheckboxWidgetProps<T, S, F>(props);
  const drawsLabel = widgetDrawsLabelText<T, S, F>(props);
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  // The plan says which description this widget draws; without a plan, a template rendering the `checkbox` alias draws
  // the description itself
  const description =
    presentation || getUiOptions(uiSchema).widget !== 'checkbox' ? getWidgetDescription<T, S, F>(props) : undefined;

  const chakraProps = getChakra(options);
  const controlAttributes = checkbox.ariaProps;

  return (
    <Field
      mb={1}
      required={checkbox.required}
      invalid={hasWidgetErrors<T, S, F>(props)}
      id={checkbox.id}
      {...chakraProps}
    >
      {description && (
        <DescriptionFieldTemplate
          id={description.id}
          description={description.text}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Checkbox
        id={checkbox.id}
        name={checkbox.name}
        checked={checkbox.checked}
        disabled={checkbox.disabled}
        onCheckedChange={({ checked }) => checkbox.onChange(checked === true)}
        onBlur={checkbox.onBlur}
        onFocus={checkbox.onFocus}
        // Ark points the input at the label it draws inside the checkbox, so with none drawn it is pointed at nothing
        inputProps={{
          ...controlAttributes,
          'aria-labelledby': labelledByOrNone(controlAttributes['aria-labelledby'], drawsLabel),
          autoFocus: checkbox.autoFocus,
        }}
      >
        {drawsLabel ? (
          <Text>
            {label}
            {checkbox.required && <ChakraField.RequiredIndicator />}
          </Text>
        ) : undefined}
      </Checkbox>
    </Field>
  );
}
