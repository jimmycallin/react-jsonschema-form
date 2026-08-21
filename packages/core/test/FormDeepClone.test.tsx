import type { RJSFSchema } from '@rjsf/utils';
import { fireEvent, act } from '@testing-library/react';

import { createFormComponent } from './testUtils';

describe('Form cloning of non-plain formData', () => {
  it('handles a field change when formData contains a function value', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    };
    const callback = () => 'kept';
    const formData: { name: string; callback?: () => string } = { name: 'initial', callback };
    const { node, onChange } = createFormComponent({ schema, formData });
    const input = node.querySelector<HTMLInputElement>('input[id=root_name]')!;
    act(() => {
      fireEvent.change(input, { target: { value: 'changed' } });
    });
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.formData.name).toBe('changed');
    expect(lastCall.formData.callback).toBe(callback);
  });

  it('handles a field change when formData contains a class instance', () => {
    class Money {
      constructor(public amount: number) {}
      format() {
        return `$${this.amount}`;
      }
    }
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    };
    const price = new Money(5);
    const formData: { name: string; price?: Money } = { name: 'initial', price };
    const { node, onChange } = createFormComponent({ schema, formData });
    const input = node.querySelector<HTMLInputElement>('input[id=root_name]')!;
    act(() => {
      fireEvent.change(input, { target: { value: 'changed' } });
    });
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    // Note: defaults merging flattens unknown object values (pre-existing behavior), so only the
    // data is asserted here; prototype preservation by the clone itself is covered in deepClone tests
    expect(lastCall.formData.price).toEqual({ amount: 5 });
    expect(lastCall.formData.name).toBe('changed');
  });
});
