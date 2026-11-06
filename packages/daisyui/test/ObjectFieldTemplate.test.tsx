import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import Form from '../src/index.ts';

describe('ObjectFieldTemplate', () => {
  it('spaces a root property named `tasks` as it does any other', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { title: { type: 'string' }, tasks: { type: 'string' } },
    };

    const { container } = render(<Form schema={schema} validator={validator} />);

    const wrapperOf = (id: string) => container.querySelector(`#${id}`)?.closest('.rjsf-field')?.parentElement;
    const tasks = wrapperOf('root_tasks');
    expect(tasks).toBeInTheDocument();
    expect(tasks).not.toHaveClass('mt-2');
    expect(tasks?.className).toBe(wrapperOf('root_title')?.className);
  });
});
