import { startTransition, useDeferredValue, useState } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';
import { input } from './testUtils.tsx';

const user = userEvent.setup();

interface Data {
  name?: string;
}

const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };

/** The form holds nothing React does not own, so a parent may accept its proposals inside a transition and read them
 * through a deferred value without the form and the parent ever disagreeing about the data
 */
describe('a parent using concurrent features', () => {
  it('accepts proposals inside startTransition', async () => {
    const proposals: (Data | undefined)[] = [];
    function TransitionParent() {
      const [data, setData] = useState<Data>({ name: '' });
      return (
        <Form<Data>
          schema={schema}
          validator={validator}
          formData={data}
          onChange={(event) => {
            proposals.push(event.formData);
            startTransition(() => setData(event.formData));
          }}
        />
      );
    }
    const { container } = render(<TransitionParent />);

    await user.type(input(container, 'root_name'), 'abc');

    await waitFor(() => expect(input(container, 'root_name')).toHaveValue('abc'));
    expect(proposals.at(-1)).toEqual({ name: 'abc' });
  });

  it('renders a deferred copy of the data that catches up with the form', async () => {
    function DeferredParent() {
      const [data, setData] = useState<Data>({ name: '' });
      const deferred = useDeferredValue(data);
      return (
        <>
          <Form<Data>
            schema={schema}
            validator={validator}
            formData={data}
            onChange={(event) => setData(event.formData)}
          />
          <output id='deferred'>{deferred.name}</output>
        </>
      );
    }
    const { container } = render(<DeferredParent />);

    await user.type(input(container, 'root_name'), 'abc');

    expect(input(container, 'root_name')).toHaveValue('abc');
    await waitFor(() => expect(container.querySelector('#deferred')).toHaveTextContent('abc'));
  });
});
