import { Component, createRef, useLayoutEffect } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import Form from '../src/index.ts';
import type { FormHandle } from '../src/index.ts';

const schema: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };
it('an earlier external sibling reads the newly committed handle during its layout effect', () => {
  const ref = createRef<FormHandle>();
  const seen: unknown[] = [];
  function Before({ value }: { value: string }) {
    useLayoutEffect(() => {
      if (ref.current) {
        seen.push({ value, data: ref.current.getFormData() });
      }
    }, [value]);
    return null;
  }
  function Tree({ value }: { value: string }) {
    return (
      <>
        <Before value={value} />
        <Form ref={ref} schema={schema} validator={validator} formData={{ a: value }} onChange={() => {}} />
      </>
    );
  }
  const { rerender } = render(<Tree value='old' />);
  rerender(<Tree value='new' />);
  expect(seen).toEqual([{ value: 'new', data: { a: 'new' } }]);
});
it('a later external sibling sees the old snapshot while the DOM is still old in getSnapshotBeforeUpdate', () => {
  const ref = createRef<FormHandle>();
  const seen: unknown[] = [];
  class After extends Component<{ value: string }> {
    // oxlint-disable-next-line class-methods-use-this -- probe a consumer before React mutates the DOM
    getSnapshotBeforeUpdate() {
      seen.push({
        data: ref.current!.getFormData(),
        input: document.querySelector<HTMLInputElement>('#root_a')!.value,
      });
      return null;
    }
    componentDidUpdate(): void {
      expect(this.props.value).toBe('new');
    }
    render(): null {
      return null;
    }
  }
  function Tree({ value }: { value: string }) {
    return (
      <>
        <Form ref={ref} schema={schema} validator={validator} formData={{ a: value }} onChange={() => {}} />
        <After value={value} />
      </>
    );
  }
  const { rerender } = render(<Tree value='old' />);
  rerender(<Tree value='new' />);
  expect(seen).toEqual([{ data: { a: 'old' }, input: 'old' }]);
});
