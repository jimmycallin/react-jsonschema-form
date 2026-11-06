import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';

const user = userEvent.setup();

describe('RadioWidget', () => {
  it("reports the focused radio's own value on focus and blur", async () => {
    const schema: RJSFSchema = { type: 'string', enum: ['foo', 'bar'] };
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <Form
        schema={schema}
        uiSchema={{ 'ui:widget': 'radio' }}
        validator={validator}
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );

    await user.click(screen.getByRole('radio', { name: 'bar' }));
    await user.tab();

    expect(onFocus).toHaveBeenCalledWith('root', 'bar');
    expect(onBlur).toHaveBeenCalledWith('root', 'bar');
  });
});
