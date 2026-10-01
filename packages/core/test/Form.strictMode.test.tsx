import { createRef, StrictMode } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { FormHandle } from '../src/index.ts';
import Form from '../src/index.ts';
import { AcceptingParent, createParentLog, fieldErrorsById, input } from './testUtils.tsx';

const user = userEvent.setup();

interface Data {
  a?: string;
  b?: string;
}

const schema: RJSFSchema = {
  type: 'object',
  properties: { a: { type: 'string', minLength: 3 }, b: { type: 'string', default: 'B' } },
};

/** StrictMode renders twice, runs every state initializer and updater twice and mounts effects twice. The form's
 * state is React state, every operation is computed from the render and committed through a pure updater, so none of
 * that changes what the user sees or what the parent is told.
 */
describe('Form under StrictMode', () => {
  it('a self-owned form seeds, edits, composes same-tick edits, validates on blur, submits and resets once', async () => {
    const ref = createRef<FormHandle>();
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const onError = vi.fn();
    const { container } = render(
      <StrictMode>
        <Form
          ref={ref}
          schema={schema}
          validator={validator}
          initialFormData={{ a: 'ab' }}
          liveValidate='onBlur'
          noHtml5Validate
          onChange={onChange}
          onSubmit={onSubmit}
          onError={onError}
        />
      </StrictMode>,
    );

    expect(ref.current?.getFormData()).toEqual({ a: 'ab', b: 'B' });

    await user.type(input(container, 'root_a'), 'c');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(ref.current?.getFormData()).toEqual({ a: 'abc', b: 'B' });

    await user.clear(input(container, 'root_a'));
    await user.type(input(container, 'root_a'), 'x');
    onChange.mockClear();
    await user.tab();
    expect(fieldErrorsById(container)).toEqual({ root_a: ['must NOT have fewer than 3 characters'] });
    // The blur reported its validation once
    expect(onChange).toHaveBeenCalledTimes(1);

    act(() => {
      ref.current?.setFieldValue('a', 'first');
      ref.current?.setFieldValue('b', 'second');
    });
    // Both updaters landed, and each ran on the same base twice without doubling anything
    expect(ref.current?.getFormData()).toEqual({ a: 'first', b: 'second' });

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].formData).toEqual({ a: 'first', b: 'second' });
    expect(onError).not.toHaveBeenCalled();

    onChange.mockClear();
    act(() => ref.current?.reset());
    expect(ref.current?.getFormData()).toEqual({ a: 'ab', b: 'B' });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('a parent-owned form proposes each edit once and renders what the parent stores', async () => {
    const log = createParentLog<Data>();
    const { container } = render(
      <StrictMode>
        <AcceptingParent<Data> schema={schema} initialValue={{ a: 'ab', b: 'B' }} liveValidate='onChange' log={log} />
      </StrictMode>,
    );

    await user.type(input(container, 'root_a'), 'c');

    expect(log.proposals).toEqual([{ a: 'abc', b: 'B' }]);
    expect(log.value).toEqual({ a: 'abc', b: 'B' });
    expect(input(container, 'root_a')).toHaveValue('abc');
    expect(fieldErrorsById(container)).toEqual({});
  });
});
