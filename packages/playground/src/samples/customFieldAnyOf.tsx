import type { FieldProps, FieldTemplateProps, RJSFSchema } from '@rjsf/utils';
import { getTemplate, noop } from '@rjsf/utils';

import type { Sample } from './Sample';

function UiField(props: FieldProps) {
  const { fieldPath: _fieldPath, id: _id, formData, onChange, registry, schema, uiSchema, ...otherProps } = props;
  const { fields, schemaUtils } = registry;
  const changeHandlerFactory = (fieldName: string) => (value: any) => {
    onChange(value, [fieldName]);
  };

  const { StringField, NumberField } = fields;
  const FieldTemplate = getTemplate('FieldTemplate', registry);
  const schema1 = (schema.anyOf?.[0] || {}) as RJSFSchema;
  const schema2 = (schema.anyOf?.[1] || {}) as RJSFSchema;
  const cityLabel = 'City';
  const latLabel = 'Latitude';
  const lonLabel = 'Longitude';
  const cityKey = 'city';
  const latKey = 'lat';
  const lonKey = 'lon';
  const citySchema = schemaUtils.findFieldInSchema(schema1, cityKey, {} as RJSFSchema);
  const latSchema = schemaUtils.findFieldInSchema(schema2, latKey, {} as RJSFSchema);
  const lonSchema = schemaUtils.findFieldInSchema(schema2, lonKey, {} as RJSFSchema);

  const fieldTemplateProps: Omit<FieldTemplateProps, 'label' | 'id' | 'fieldPath' | 'children'> = {
    registry,
    schema,
    uiSchema,
    displayLabel: true,
    disabled: false,
    readonly: false,
    onChange,
    onKeyRename: () => noop,
    onKeyRenameBlur: () => noop,
    onRemoveProperty: () => noop,
  };

  return (
    <>
      <h4>Location</h4>
      <div style={{ display: 'flex' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '50%',
            margin: '1rem',
          }}
        >
          <FieldTemplate {...fieldTemplateProps} fieldPath={cityKey} id={cityKey} label={cityLabel}>
            <StringField
              schema={citySchema.field!}
              registry={registry}
              {...otherProps}
              name={cityLabel}
              required={citySchema.isRequired}
              fieldPath={cityKey}
              id={cityKey}
              formData={formData.city}
              onChange={changeHandlerFactory(cityKey)}
            />
          </FieldTemplate>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '50%',
            margin: '1rem',
          }}
        >
          <FieldTemplate {...fieldTemplateProps} fieldPath={latKey} id={latKey} label={latLabel}>
            <NumberField
              schema={latSchema.field!}
              registry={registry}
              {...otherProps}
              name={latLabel}
              required={latSchema.isRequired}
              fieldPath={latKey}
              id={latKey}
              formData={formData.lat}
              onChange={changeHandlerFactory(latKey)}
            />
          </FieldTemplate>
          <FieldTemplate {...fieldTemplateProps} fieldPath={lonKey} id={lonKey} label={lonLabel}>
            <NumberField
              schema={lonSchema.field!}
              registry={registry}
              {...otherProps}
              name={lonLabel}
              required={lonSchema.isRequired}
              fieldPath={lonKey}
              id={lonKey}
              formData={formData.lon}
              onChange={changeHandlerFactory(lonKey)}
            />
          </FieldTemplate>
        </div>
      </div>
    </>
  );
}

const customFieldAnyOf: Sample = {
  schema: {
    title: 'Location',
    type: 'object',
    anyOf: [
      {
        title: 'City',
        properties: {
          city: {
            type: 'string',
          },
        },
        required: ['city'],
      },
      {
        title: 'Coordinates',
        properties: {
          lat: {
            type: 'number',
          },
          lon: {
            type: 'number',
          },
        },
        required: ['lat', 'lon'],
      },
    ],
  },
  uiSchema: {
    'ui:field': UiField,
    'ui:fieldReplacesAnyOrOneOf': true,
  },
  formData: {},
};

export default customFieldAnyOf;
