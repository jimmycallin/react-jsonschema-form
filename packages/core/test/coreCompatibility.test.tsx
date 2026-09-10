import { createRef } from 'react';
import { createSchemaUtils } from '@rjsf/utils';
import type { RJSFSchema } from '@rjsf/utils';
import validator, { customizeValidator } from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import Form, { createForm, getDefaultRegistry, Theme } from '../src/index.ts';

describe('core API compatibility', () => {
  it('supports generic JSX, class refs and subclassing', () => {
    class CustomForm extends Form<string> {}
    const ref = createRef<Form<string>>();
    const { container } = render(
      <CustomForm schema={{ type: 'string' }} validator={customizeValidator<string>()} formData='test' ref={ref} />,
    );
    expect(container.querySelector('input')).toBeInTheDocument();
    expect(ref.current).toBeInstanceOf(Form);
    expect(ref.current?.validateForm()).toBe(true);
  });

  it('exposes default registry components and merges overrides through Form.getRegistry', () => {
    const defaults = getDefaultRegistry();
    const schema: RJSFSchema = { type: 'string' };
    const widgets = { custom: defaults.widgets.TextWidget };
    const registry = Form.getRegistry({ schema, validator, widgets }, schema, createSchemaUtils(validator, schema));
    expect(registry.widgets.custom).toBe(widgets.custom);
    expect(registry.widgets.TextWidget).toBe(defaults.widgets.TextWidget);
    expect(registry.templates.ButtonTemplates.SubmitButton).toBe(defaults.templates.ButtonTemplates.SubmitButton);
  });

  it('does not add core widgets to a complete theme', () => {
    const CustomForm = createForm({ ...Theme, widgets: {} });
    const ref = createRef<Form>();
    render(<CustomForm schema={{ type: 'object' }} validator={validator} ref={ref} />);
    expect(ref.current?.state.registry.widgets).toEqual({});
  });
});
