import type { CheckboxProps } from '@mui/material/Checkbox';
import Checkbox from '@mui/material/Checkbox';
import type { FormControlLabelProps } from '@mui/material/FormControlLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import type { FormContextType, GenericObjectType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getTemplates, getWidgetDescription, labelValue, useCheckboxWidgetProps } from '@rjsf/utils';

import { getMuiProps, withInputSlot } from '../util.ts';

/** Properties available for the `rjsfSlotProps` target of the CheckboxWidget. */
export interface CheckboxWidgetMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the CheckboxWidget. */
  rjsfSlotProps?: {
    /** Props applied to the individual `Checkbox` component. */
    checkbox?: CheckboxProps;
    /** Props applied to the `FormControlLabel` component wrapping the checkbox. */
    formControlLabel?: FormControlLabelProps;
  };
}

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { schema, label, registry, options, uiSchema } = props;
  const checkbox = useCheckboxWidgetProps<T, S, F>(props);
  const hideLabel = !checkbox.drawsLabel;
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  const description = getWidgetDescription<T, S, F>(props);

  const { rjsfSlotProps: muiSlotProps, ...otherMuiProps } = getMuiProps<T, S, F, CheckboxWidgetMuiProps>(options);

  return (
    <>
      {description && (
        <DescriptionFieldTemplate
          id={description.id}
          description={description.text}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <FormControlLabel
        {...otherMuiProps}
        {...muiSlotProps?.formControlLabel}
        required={checkbox.required}
        control={
          <Checkbox
            id={checkbox.id}
            name={checkbox.name}
            checked={checkbox.checked}
            required={checkbox.required}
            disabled={checkbox.disabled}
            autoFocus={checkbox.autoFocus}
            onChange={(_, checked) => checkbox.onChange(checked)}
            onBlur={checkbox.onBlur}
            onFocus={checkbox.onFocus}
            {...muiSlotProps?.checkbox}
            // The `<input>` carrying the field's id takes its plan, rather than the `<span>` around it
            slotProps={withInputSlot(checkbox.ariaProps, muiSlotProps?.checkbox?.slotProps)}
          />
        }
        label={labelValue(label, hideLabel, false)}
      />
    </>
  );
}
