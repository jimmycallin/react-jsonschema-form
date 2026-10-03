import { Suspense, use, createRef, startTransition, useLayoutEffect, StrictMode, useState } from 'react';
import type { FieldProps, RJSFSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';
import type { FormHandle } from '../src/index.ts';

const user = userEvent.setup();

const schema: RJSFSchema = { type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } } };
it('uses the current render callback when a descendant callback ref reports a change', () => {
  const oldCallback = vi.fn();
  const newCallback = vi.fn();
  function Field({ onChange, fieldPath, formData }: FieldProps<string>) {
    return (
      <input
        value={formData ?? ''}
        readOnly
        ref={(node) => {
          if (node && formData === 'new') {
            onChange('B', 'b' as typeof fieldPath, undefined, 'root_b');
          }
        }}
      />
    );
  }
  const uiSchema = { a: { 'ui:field': Field } };
  const { rerender } = render(
    <Form
      schema={schema}
      validator={validator}
      formData={{ a: 'old', b: '' }}
      uiSchema={uiSchema}
      onChange={oldCallback}
    />,
  );
  rerender(
    <Form
      schema={schema}
      validator={validator}
      formData={{ a: 'new', b: '' }}
      uiSchema={uiSchema}
      onChange={newCallback}
    />,
  );
  expect(oldCallback).not.toHaveBeenCalled();
  expect(newCallback).toHaveBeenCalledWith(expect.objectContaining({ formData: { a: 'new', b: 'B' } }), 'root_b');
});
it('does not publish an abandoned suspended render to retained handles or field handlers', async () => {
  const ref = createRef<FormHandle>();
  const oldCallback = vi.fn();
  const pendingCallback = vi.fn();
  const forever = new Promise<void>(() => {});
  let attempted = false;
  function Block({ pending }: { pending: boolean }) {
    if (pending) {
      attempted = true;
      use(forever);
    }
    return null;
  }
  function Tree({ pending }: { pending: boolean }) {
    return (
      <Suspense fallback={<span>pending</span>}>
        <Form
          ref={ref}
          schema={schema}
          validator={validator}
          formData={{ a: pending ? 'speculative' : 'committed', b: '' }}
          onChange={pending ? pendingCallback : oldCallback}
        >
          <Block pending={pending} />
        </Form>
      </Suspense>
    );
  }
  const { container, rerender } = render(
    <StrictMode>
      <Tree pending={false} />
    </StrictMode>,
  );
  const handle = ref.current!;
  await act(async () => {
    startTransition(() =>
      rerender(
        <StrictMode>
          <Tree pending />
        </StrictMode>,
      ),
    );
  });
  expect(attempted).toBe(true);
  expect(handle.getFormData()).toEqual({ a: 'committed', b: '' });
  await user.type(container.querySelector('#root_b')!, 'B');
  expect(pendingCallback).not.toHaveBeenCalled();
  expect(oldCallback).toHaveBeenCalledWith(expect.objectContaining({ formData: { a: 'committed', b: 'B' } }), 'root_b');
});

it('keeps retained handles stable and current after an edit', async () => {
  const ref = createRef<FormHandle>();
  const { container } = render(
    <Form ref={ref} schema={schema} validator={validator} initialFormData={{ a: '', b: '' }} />,
  );
  const initialHandle = ref.current!;
  await user.type(container.querySelector('#root_a')!, 'A');
  expect(ref.current).toBe(initialHandle);
  expect(ref.current!.getFormData()).toEqual({ a: 'A', b: '' });
  expect(initialHandle.getFormData()).toEqual({ a: 'A', b: '' });
  act(() => ref.current!.setFieldValue('b', 'B'));
  expect(ref.current!.getFormData()).toEqual({ a: 'A', b: 'B' });
});

it('uses a replaced callback when an unchanged sibling is edited', async () => {
  const first = vi.fn();
  const second = vi.fn();
  const { container, rerender } = render(
    <Form schema={schema} validator={validator} initialFormData={{ a: '', b: '' }} onChange={first} />,
  );
  rerender(<Form schema={schema} validator={validator} initialFormData={{ a: '', b: '' }} onChange={second} />);
  await user.type(container.querySelector('#root_b')!, 'B');
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledWith(expect.objectContaining({ formData: { a: '', b: 'B' } }), 'root_b');
});

it('composes same-tick operations without running callbacks inside state updaters', () => {
  const ref = createRef<FormHandle>();
  const onChange = vi.fn();
  render(
    <StrictMode>
      <Form ref={ref} schema={schema} validator={validator} initialFormData={{ a: '', b: '' }} onChange={onChange} />
    </StrictMode>,
  );
  act(() => {
    ref.current!.setFieldValue('a', 'A');
    ref.current!.setFieldValue('b', 'B');
  });
  expect(ref.current!.getFormData()).toEqual({ a: 'A', b: 'B' });
  expect(onChange).toHaveBeenCalledTimes(2);
  expect(onChange.mock.calls.map(([event]) => event.formData)).toEqual([
    { a: 'A', b: '' },
    { a: '', b: 'B' },
  ]);
});

it('a guarded dependent-field layout effect clears once and preserves the sibling edit', async () => {
  const onProposal = vi.fn();
  function Clear({ formData, fieldPath, onChange, registry }: FieldProps) {
    const sibling = registry.formContext.a;
    useLayoutEffect(() => {
      if (sibling && formData !== null) {
        onChange(null, fieldPath);
      }
    }, [sibling, formData, fieldPath, onChange]);
    return <span>{String(formData)}</span>;
  }
  const uiSchema = { b: { 'ui:field': Clear } };
  function Parent() {
    const [data, setData] = useState<{ a: string; b: string | null }>({ a: '', b: 'keep' });
    return (
      <Form
        schema={schema}
        validator={validator}
        formData={data}
        uiSchema={uiSchema}
        formContext={{ a: data.a }}
        onChange={(event) => {
          onProposal(event.formData);
          setData(event.formData);
        }}
      />
    );
  }
  const { container } = render(<Parent />);
  await user.type(container.querySelector('#root_a')!, 'A');
  expect(onProposal.mock.calls.map(([data]) => data)).toEqual([
    { a: 'A', b: 'keep' },
    { a: 'A', b: null },
  ]);
  expect(container.querySelector('#root_a')).toHaveValue('A');
});

it.each([false, true])('renders only the edited widget over 200 rows, controlled=%s', async (controlled) => {
  const rendered = vi.fn();
  function Widget(props: WidgetProps<string[]>) {
    rendered(props.id);
    return <input id={props.id} value={props.value ?? ''} onChange={(event) => props.onChange(event.target.value)} />;
  }
  const widgets = { TextWidget: Widget };
  const arraySchema: RJSFSchema = { type: 'array', items: { type: 'string' } };
  const initial = Array<string>(200).fill('');
  function Parent() {
    const [data, setData] = useState(initial);
    return (
      <Form<string[]>
        schema={arraySchema}
        validator={validator}
        widgets={widgets}
        {...(controlled
          ? { formData: data, onChange: (event) => setData(event.applyTo) }
          : { initialFormData: initial })}
      />
    );
  }
  const { container } = render(<Parent />);
  rendered.mockClear();
  await user.type(container.querySelector('#root_0')!, 'abc');
  expect(container.querySelector('#root_0')).toHaveValue('abc');
  expect(rendered).toHaveBeenCalledTimes(3);
});
