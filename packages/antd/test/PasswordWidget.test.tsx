import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';

const user = userEvent.setup();

describe('PasswordWidget', () => {
  test('writes no value for an emptied password with no ui:emptyValue', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Form
        schema={{ type: 'string' }}
        uiSchema={{ 'ui:widget': 'password' }}
        validator={validator}
        initialFormData='a'
        onChange={onChange}
      />,
    );
    const input = container.querySelector('#root');
    if (!input) {
      throw new Error('no password input');
    }
    await user.clear(input);

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: undefined }), 'root');
  });
  test('puts ui:autocomplete on the input', () => {
    const { container } = render(
      <Form
        schema={{ type: 'string' }}
        uiSchema={{ 'ui:widget': 'password', 'ui:autocomplete': 'new-password' }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root')).toHaveAttribute('autocomplete', 'new-password');
  });
  test('lists the schema examples', () => {
    const { container } = render(
      <Form
        schema={{ type: 'string', examples: ['hunter2'] }}
        uiSchema={{ 'ui:widget': 'password' }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root')).toHaveAttribute('list', 'root__examples');
    expect(container.querySelector('datalist#root__examples option')).toHaveAttribute('value', 'hunter2');
  });
  test('offers a clear button that empties the password', async () => {
    const onChange = vi.fn();
    render(
      <Form
        schema={{ type: 'string' }}
        uiSchema={{ 'ui:widget': 'password', 'ui:allowClearTextInputs': true }}
        validator={validator}
        initialFormData='a'
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /^close$/ }));

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: undefined }), 'root');
  });
});
