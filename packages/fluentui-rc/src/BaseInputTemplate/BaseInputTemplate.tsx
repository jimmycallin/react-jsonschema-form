import type { InputProps } from '@fluentui/react-components';
import { Input, Label, makeStyles } from '@fluentui/react-components';
import { SchemaExamples } from '@rjsf/core';
import type { BaseInputTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { labelValue, useBaseInputProps, widgetDrawsLabelText } from '@rjsf/utils';

const useStyles = makeStyles({
  input: {
    width: '100%',
  },
  label: {
    paddingTop: '2px',
    paddingBottom: '2px',
    marginBottom: '2px',
  },
});

/** The `BaseInputTemplate` is the template to use to render the basic `<input>` component for the `core` theme.
 * It is used as the template for rendering many of the <input> based widgets that differ by `type` and callbacks only.
 * It can be customized/overridden for other themes or individual implementations as needed.
 *
 * @param props - The `WidgetProps` for this template
 */
export default function BaseInputTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: BaseInputTemplateProps<T, S, F>) {
  const { label, onChangeOverride, schema, registry } = props;
  // A label holding only a required field's `*` would name the input "star", so one is drawn only with text
  const hideLabel = !widgetDrawsLabelText<T, S, F>(props);
  const { ClearButton } = registry.templates.ButtonTemplates;
  const classes = useStyles();
  const input = useBaseInputProps<T, S, F>(props);
  return (
    <>
      {labelValue(
        <Label htmlFor={input.id} required={input.required} disabled={input.disabled} className={classes.label}>
          {label}
        </Label>,
        hideLabel,
      )}
      <Input
        id={input.id}
        name={input.name}
        placeholder={input.placeholder}
        autoFocus={input.autoFocus}
        required={input.required}
        disabled={input.disabled || input.readOnly}
        title={input.title}
        {...(input.inputProps as InputProps)}
        input={{
          className: classes.input,
          // Due to Fluent UI this does not work correctly
          list: input.listId,
        }}
        value={String(input.value)}
        onChange={onChangeOverride ?? ((event) => input.onChange(event.target.value))}
        onFocus={input.onFocus}
        onBlur={input.onBlur}
        {...input.ariaProps}
      />
      {input.showClearButton && <ClearButton registry={registry} onClick={input.onClear} />}
      <SchemaExamples id={input.id} schema={schema} suggestions={input.exampleSuggestions} />
    </>
  );
}
