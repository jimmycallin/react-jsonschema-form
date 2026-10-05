import { createRef, Suspense, startTransition, useEffect, useLayoutEffect, useState } from 'react';
import type {
  ArrayFieldItemButtonsTemplateProps,
  ArrayFieldItemTemplateProps,
  ObjectFieldTemplateProps,
  FieldProps,
  RJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';

import ArrayField from '../src/components/fields/ArrayField.tsx';
import type { FormRef } from '../src/index.ts';
import Form, { ArrayFieldItemTemplate as DefaultItemTemplate } from '../src/index.ts';
import { AcceptingParent, createFormComponent } from './testUtils.tsx';

const user = userEvent.setup();
const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };

it('an abandoned concurrent render does not publish parent data or callbacks to the model', async () => {
  const ref = createRef<FormRef<{ name: string }>>();
  const committedCallback = vi.fn();
  const pendingCallback = vi.fn();
  const never = new Promise<void>(() => {});
  function SuspendingWidget({ value }: WidgetProps) {
    if (value === 'pending') {
      // oxlint-disable-next-line typescript/only-throw-error -- Suspense receives a thenable
      throw never;
    }
    return <span>{value}</span>;
  }
  function Parent() {
    const [value, setValue] = useState('committed');
    return (
      <>
        <button type='button' onClick={() => startTransition(() => setValue('pending'))}>
          Suspend
        </button>
        <Suspense fallback={<span>Loading</span>}>
          <Form
            ref={ref}
            schema={schema}
            validator={validator}
            formData={{ name: value }}
            onChange={value === 'pending' ? pendingCallback : committedCallback}
            widgets={{ TextWidget: SuspendingWidget }}
          />
        </Suspense>
      </>
    );
  }
  render(<Parent />);
  await user.click(screen.getByRole('button', { name: 'Suspend' }));
  expect(ref.current?.getFormData()).toEqual({ name: 'committed' });
  act(() => ref.current?.setFieldValue('name', 'event'));
  expect(committedCallback).toHaveBeenLastCalledWith(
    expect.objectContaining({ formData: { name: 'event' } }),
    'root_name',
  );
  expect(pendingCallback).not.toHaveBeenCalled();
});

it('an array wrapper edits its displayed sorted view rather than the raw model order', async () => {
  function SortedArray(props: FieldProps<string[]>) {
    return <ArrayField {...props} formData={[...(props.formData ?? [])].sort()} />;
  }
  function RemoveButton({ index, onRemoveItem }: ArrayFieldItemButtonsTemplateProps) {
    return (
      <button type='button' onClick={onRemoveItem}>
        Remove {index}
      </button>
    );
  }
  const { onChange, getFormData } = createFormComponent({
    schema: { type: 'array', items: { type: 'string' } },
    initialFormData: ['b', 'a', 'c'],
    fields: { ArrayField: SortedArray },
    templates: { ArrayFieldItemButtonsTemplate: RemoveButton },
  });
  await user.click(screen.getByRole('button', { name: 'Remove 0' }));
  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: ['b', 'c'] }), 'root');
  expect(getFormData()).toEqual(['b', 'c']);
});

it('renders seeded data on the server without a browser or effect publishing a snapshot', () => {
  const markup = renderToString(<Form schema={schema} validator={validator} initialFormData={{ name: 'server' }} />);
  expect(markup).toContain('value="server"');
});

it('new controlled props are available to passive Effects after the descendant layout phase', () => {
  const ref = createRef<FormRef<{ name: string }>>();
  const phases: [string, unknown, unknown][] = [];
  function ObservingWidget({ value }: WidgetProps) {
    useLayoutEffect(() => {
      phases.push(['layout', value, ref.current?.getFormData()]);
    }, [value]);
    useEffect(() => {
      phases.push(['passive', value, ref.current?.getFormData()]);
    }, [value]);
    return <span>{value}</span>;
  }
  const props = { ref, schema, validator, widgets: { TextWidget: ObservingWidget }, onChange: vi.fn() };
  const { rerender } = render(<Form {...props} formData={{ name: 'before' }} />);
  phases.length = 0;
  rerender(<Form {...props} formData={{ name: 'after' }} />);
  expect(phases).toEqual([
    ['layout', 'after', { name: 'before' }],
    ['passive', 'after', { name: 'after' }],
  ]);
});

it('several additional-property adds in one event use current self-owned data', async () => {
  function AddTwice({ properties, onAddProperty }: ObjectFieldTemplateProps) {
    return (
      <div>
        {properties.map(({ content }) => content)}
        <button
          type='button'
          onClick={() => {
            onAddProperty();
            onAddProperty();
          }}
        >
          Add twice
        </button>
      </div>
    );
  }
  const { onChange, getFormData } = createFormComponent({
    schema: { type: 'object', additionalProperties: { type: 'string', default: 'value' } },
    templates: { ObjectFieldTemplate: AddTwice },
  });
  await user.click(screen.getByRole('button', { name: 'Add twice' }));
  expect(getFormData()).toEqual({ newKey: 'value', 'newKey-1': 'value' });
  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: getFormData() }), 'root');
});

it.each([false, true])(
  'an edit renders zero unaffected rows or widgets in a 200-item form (controlled: %s)',
  async (controlled) => {
    const rows = new Map<number, number>();
    const widgets = new Map<string, number>();
    function CountingItem(props: ArrayFieldItemTemplateProps) {
      rows.set(props.index, (rows.get(props.index) ?? 0) + 1);
      return <DefaultItemTemplate {...props} />;
    }
    function CountingWidget({ id, value, onChange }: WidgetProps) {
      widgets.set(id, (widgets.get(id) ?? 0) + 1);
      return <input id={id} value={value ?? ''} onChange={(event) => onChange(event.target.value)} />;
    }
    const props = {
      schema: { type: 'array', items: { type: 'string' } } as RJSFSchema,
      widgets: { TextWidget: CountingWidget },
      templates: { ArrayFieldItemTemplate: CountingItem },
    };
    const initial = Array.from({ length: 200 }, (_, index) => String(index));
    const { container } = controlled
      ? render(<AcceptingParent<string[]> {...props} initialValue={initial} />)
      : createFormComponent({ ...props, initialFormData: initial });
    const previousRows = new Map(rows);
    const previousWidgets = new Map(widgets);
    expect(previousRows.size).toBe(200);
    expect(previousWidgets.size).toBe(200);
    await user.type(container.querySelector<HTMLInputElement>('#root_0')!, 'x');
    expect(widgets.get('root_0')).toBeGreaterThan(previousWidgets.get('root_0')!);
    for (let index = 1; index < 200; index++) {
      expect(rows.get(index)).toBe(previousRows.get(index));
      expect(widgets.get(`root_${index}`)).toBe(previousWidgets.get(`root_${index}`));
    }
  },
);

it.each([false, true])(
  'same-tick validation sees owned custom errors without installing a controlled proposal (controlled: %s)',
  async (controlled) => {
    const ref = createRef<FormRef>();
    const results: boolean[] = [];
    function RaiseAndValidate({ fieldPath, onChange }: FieldProps) {
      return (
        <button
          type='button'
          onClick={() => {
            onChange('proposal', fieldPath, { __errors: ['blocked'] });
            results.push(ref.current!.validateForm());
          }}
        >
          Raise and validate
        </button>
      );
    }
    const props = {
      ref,
      schema,
      uiSchema: { name: { 'ui:field': RaiseAndValidate } },
      onError: vi.fn(),
      onChange: vi.fn(),
    };
    if (controlled) {
      render(<Form {...props} validator={validator} formData={{ name: 'committed' }} />);
    } else {
      createFormComponent({ ...props, initialFormData: { name: 'committed' } });
    }
    await user.click(screen.getByRole('button', { name: 'Raise and validate' }));
    expect(results).toEqual([false]);
    expect(ref.current?.getFormData()).toEqual({ name: controlled ? 'committed' : 'proposal' });
    expect(props.onError).toHaveBeenLastCalledWith(
      expect.arrayContaining([expect.objectContaining({ message: 'blocked' })]),
    );
  },
);
