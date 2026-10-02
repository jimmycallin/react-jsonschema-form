import { createRef, StrictMode, startTransition, useLayoutEffect, useState } from 'react';
import type { ErrorSchema, FieldProps, RJSFSchema, WidgetProps } from '@rjsf/utils';
import { createSchemaUtils, deepEquals, getTemplates, getUiOptions, noop } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { IChangeEvent } from '../src/index.ts';
import Form from '../src/index.ts';
import {
  AcceptingParent,
  ComposingParent,
  createFormComponent,
  createParentLog,
  describeOwnerships,
  fieldErrorsById,
  input,
  RejectingParent,
  setupConsoleWarnSuppression,
  submitForm,
  TransformingParent,
} from './testUtils.tsx';

const user = userEvent.setup();

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    a: { type: 'string' },
    b: { type: 'string' },
  },
};

interface Data {
  a?: string;
  b?: string;
}

/** The ownership contract (RFC, section 6): a form with a `formData` prop renders the parent's value and only ever
 * proposes; one without owns its value. A `vi.fn()` `onChange` is a rejecting parent.
 */
describe('form data ownership', () => {
  const warnings = setupConsoleWarnSuppression();

  describe('fixed controlled data', () => {
    it('an edit is proposed but does not change the rendered data without acceptance', async () => {
      const log = createParentLog<Data>();
      const { container } = render(<RejectingParent<Data> schema={schema} initialValue={{ a: 'a' }} log={log} />);

      await user.click(input(container, 'root_a'));
      await user.paste('b');

      expect(log.proposals).toEqual([{ a: 'ab' }]);
      expect(input(container, 'root_a')).toHaveValue('a');
    });

    it('a spy handler is a rejecting parent, so the form keeps rendering the prop', async () => {
      const { node, onChange } = createFormComponent({ schema, formData: { a: 'a' } });

      await user.click(node.querySelector('#root_a')!);
      await user.paste('b');

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].formData).toEqual({ a: 'ab' });
      expect(node.querySelector('#root_a')).toHaveValue('a');
    });
  });

  describe('accepted and transformed updates', () => {
    it('an accepting parent renders each proposal with exactly one callback per edit', async () => {
      const log = createParentLog<Data>();
      const { container } = render(<AcceptingParent<Data> schema={schema} initialValue={{ a: '' }} log={log} />);

      await user.type(input(container, 'root_a'), 'abc');

      expect(log.proposals.map((proposal) => proposal?.a)).toEqual(['a', 'ab', 'abc']);
      expect(input(container, 'root_a')).toHaveValue('abc');
    });

    it("a transforming parent's value wins and its acceptance causes no echo callback", async () => {
      const log = createParentLog<Data>();
      const upper = (proposal: Data | undefined) => proposal && { ...proposal, a: proposal.a?.toUpperCase() };
      const { container } = render(
        <TransformingParent<Data> schema={schema} initialValue={{ a: '' }} log={log} transform={upper} />,
      );

      await user.type(input(container, 'root_a'), 'ab');

      expect(log.proposals).toEqual([{ a: 'a' }, { a: 'Ab' }]);
      expect(input(container, 'root_a')).toHaveValue('AB');
    });
  });

  describe('external replacement', () => {
    /** Records the value the `a` widget has at every commit, so a stale value committed before the parent's value
     * would show up in the sequence and not just be overwritten by the final DOM
     */
    function recordingWidget(seen: unknown[]) {
      return function Recording(props: WidgetProps) {
        const { BaseInputTemplate } = getTemplates(props.registry, getUiOptions(props.uiSchema));
        useLayoutEffect(() => {
          seen.push(props.value);
        });
        return <BaseInputTemplate {...props} />;
      };
    }

    it('renders the new prop at once, with no stale-data commit in between', () => {
      const seen: unknown[] = [];
      const uiSchema = { a: { 'ui:widget': recordingWidget(seen) } };
      function Parent({ value }: { value: Data }) {
        return <Form schema={schema} uiSchema={uiSchema} validator={validator} formData={value} onChange={noop} />;
      }
      const { rerender } = render(<Parent value={{ a: 'old' }} />);

      rerender(<Parent value={{ a: 'new' }} />);

      expect(seen).toEqual(['old', 'new']);
    });

    it('an unrelated re-render neither resets the data nor commits anything', () => {
      const seen: unknown[] = [];
      const uiSchema = { a: { 'ui:widget': recordingWidget(seen) } };
      const value = { a: 'kept' };
      function Parent({ tick }: { tick: number }) {
        return (
          <Form
            schema={schema}
            uiSchema={uiSchema}
            validator={validator}
            formData={value}
            className={`tick-${tick}`}
            onChange={noop}
          />
        );
      }
      const { rerender, container } = render(<Parent tick={0} />);

      rerender(<Parent tick={1} />);

      expect(seen).toEqual(['kept']);
      expect(input(container, 'root_a')).toHaveValue('kept');
    });
  });

  describe('controlled reset', () => {
    const withDefault: RJSFSchema = {
      type: 'object',
      required: ['a'],
      properties: { a: { type: 'string', minLength: 3 }, b: { type: 'string', default: 'defaulted' } },
    };

    it('clears local errors, keeps the loaded data, computes no defaults and calls no onChange', async () => {
      const ref = createRef<Form>();
      const onChange = vi.fn();
      const { container } = render(
        <Form ref={ref} schema={withDefault} validator={validator} formData={{ a: 'x' }} onChange={onChange} />,
      );
      await act(async () => {
        ref.current!.validateForm();
      });
      expect(container.querySelectorAll('.error-detail li')).toHaveLength(1);

      act(() => {
        ref.current!.reset();
      });

      expect(container.querySelectorAll('.error-detail li')).toHaveLength(0);
      expect(input(container, 'root_a')).toHaveValue('x');
      expect(input(container, 'root_b')).toHaveValue('');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('keeps the parent-supplied extraErrors', () => {
      const ref = createRef<Form>();
      const extraErrors: ErrorSchema = { a: { __errors: ['from the server'] } };
      const { container } = render(
        <Form
          ref={ref}
          schema={withDefault}
          validator={validator}
          formData={{ a: 'x' }}
          extraErrors={extraErrors}
          onChange={noop}
        />,
      );

      act(() => {
        ref.current!.reset();
      });

      expect(container.querySelector('.error-detail li')).toHaveTextContent('from the server');
    });

    it('lets the parent replace the data and clear local errors in one step without an old-value echo', async () => {
      const ref = createRef<Form<Data>>();
      const proposals: unknown[] = [];
      function Parent() {
        const [data, setData] = useState<Data>({ a: 'x' });
        return (
          <>
            <button
              type='button'
              onClick={() => {
                setData({ a: 'replaced' });
                ref.current!.reset();
              }}
            >
              reload
            </button>
            <Form
              ref={ref}
              schema={withDefault}
              validator={validator}
              formData={data}
              onChange={(event) => {
                proposals.push(event.formData);
                setData(event.formData);
              }}
            />
          </>
        );
      }
      const { container } = render(<Parent />);
      await act(async () => {
        ref.current!.validateForm();
      });
      expect(container.querySelectorAll('.error-detail li')).toHaveLength(1);

      await user.click(container.querySelector('button')!);

      expect(input(container, 'root_a')).toHaveValue('replaced');
      expect(container.querySelectorAll('.error-detail li')).toHaveLength(0);
      expect(proposals).toEqual([]);
    });
  });

  describe('no controlled defaults', () => {
    const withDefaults: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string', default: 'A' }, b: { type: 'string', default: 'B' } },
    };

    it('mount, a semantic schema change and a data-only replacement emit no onChange, in StrictMode too', () => {
      const onChange = vi.fn();
      function Parent({ schema: current, value }: { schema: RJSFSchema; value: Data }) {
        return (
          <StrictMode>
            <Form schema={current} validator={validator} formData={value} onChange={onChange} />
          </StrictMode>
        );
      }
      const { rerender, container } = render(<Parent schema={withDefaults} value={{}} />);
      expect(input(container, 'root_a')).toHaveValue('');

      rerender(<Parent schema={{ ...withDefaults, title: 'changed' }} value={{}} />);
      rerender(<Parent schema={{ ...withDefaults, title: 'changed' }} value={{ a: 'given' }} />);

      expect(onChange).not.toHaveBeenCalled();
      expect(input(container, 'root_a')).toHaveValue('given');
      expect(input(container, 'root_b')).toHaveValue('');
    });

    it('a parent seeded with getDefaultFormState renders the defaults on the first render', () => {
      const onChange = vi.fn();
      const seeded = createSchemaUtils({ validator }, withDefaults).getDefaultFormState(withDefaults, {
        a: 'given',
      });
      const { container } = render(
        <Form schema={withDefaults} validator={validator} formData={seeded} onChange={onChange} />,
      );

      expect(input(container, 'root_a')).toHaveValue('given');
      expect(input(container, 'root_b')).toHaveValue('B');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('a controlled root that becomes undefined stays controlled and does not warn', () => {
      const onChange = vi.fn();
      function Parent({ value }: { value: Data | undefined }) {
        return <Form schema={withDefaults} validator={validator} formData={value} onChange={onChange} />;
      }
      const { rerender, container } = render(<Parent value={{ a: 'x' }} />);

      rerender(<Parent value={undefined} />);

      expect(input(container, 'root_a')).toHaveValue('');
      expect(onChange).not.toHaveBeenCalled();
      expect(warnings.consoleSpy).not.toHaveBeenCalled();

      rerender(<Parent value={{ a: 'y' }} />);

      expect(input(container, 'root_a')).toHaveValue('y');
    });

    it('a null root at mount is controlled: a field edit proposes the object it creates, defaults included', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <Form schema={withDefaults} validator={validator} formData={null} onChange={onChange} />,
      );
      expect(input(container, 'root_a')).toHaveValue('');

      await user.click(input(container, 'root_a'));
      await user.paste('x');

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].formData).toEqual({ a: 'x', b: 'B' });
      expect(input(container, 'root_a')).toHaveValue('');
      expect(warnings.consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('controlled composition', () => {
    /** Two path changes in one `act`, through the form's own change path, with exactly `setData(event.formData)` */
    const acceptAll = () => true;
    const keepProposal = (proposal: Data) => proposal;

    function PolicyParent({
      ref,
      accept = acceptAll,
      transform = keepProposal,
      log,
    }: {
      ref: React.RefObject<Form<Data> | null>;
      accept?: (proposal: Data) => boolean;
      transform?: (proposal: Data) => Data;
      log: { value?: Data; proposals: Data[] };
    }) {
      const [data, setData] = useState<Data>({ a: '', b: '' });
      Object.assign(log, { value: data });
      return (
        <Form<Data>
          ref={ref}
          schema={schema}
          validator={validator}
          formData={data}
          onChange={(event) => {
            const proposal = event.formData;
            log.proposals.push(proposal);
            if (accept(proposal)) {
              setData(transform(proposal));
            }
          }}
        />
      );
    }

    it('two path changes in one tick each propose from the rendered value, and the parent keeps the last', async () => {
      const ref = createRef<Form<Data>>();
      const log = { proposals: [] as Data[] } as { value?: Data; proposals: Data[] };
      const { container } = render(<PolicyParent ref={ref} log={log} />);

      await act(async () => {
        ref.current!.setFieldValue('a', 'first');
        ref.current!.setFieldValue('b', 'second');
      });

      // Like two changes to a controlled `<input>` in one tick: neither sees the other, the parent stores the last
      expect(log.proposals).toEqual([
        { a: 'first', b: '' },
        { a: '', b: 'second' },
      ]);
      expect(log.value).toEqual({ a: '', b: 'second' });
      expect(input(container, 'root_a')).toHaveValue('');
      expect(input(container, 'root_b')).toHaveValue('second');
    });

    it('a root replacement writes several fields in one proposal', async () => {
      const ref = createRef<Form<Data>>();
      const log = { proposals: [] as Data[] } as { value?: Data; proposals: Data[] };
      const { container } = render(
        <PolicyParent ref={ref} log={log} transform={(proposal) => ({ ...proposal, a: proposal.a?.toUpperCase() })} />,
      );

      await act(async () => {
        ref.current?.setFieldValue([], { ...ref.current?.getFormData(), a: 'first', b: 'second' });
      });

      expect(log.proposals).toEqual([{ a: 'first', b: 'second' }]);
      expect(log.value).toEqual({ a: 'FIRST', b: 'second' });
      expect(input(container, 'root_a')).toHaveValue('FIRST');
      expect(input(container, 'root_b')).toHaveValue('second');
    });

    it('a rejected first value is not resurrected by the second change', async () => {
      const ref = createRef<Form<Data>>();
      const log = { proposals: [] as Data[] } as { value?: Data; proposals: Data[] };
      render(<PolicyParent ref={ref} log={log} accept={(proposal) => proposal.a !== 'first'} />);

      await act(async () => {
        ref.current!.setFieldValue('a', 'first');
        ref.current!.setFieldValue('b', 'second');
      });

      expect(log.value).toEqual({ a: '', b: 'second' });
      expect(log.proposals).toEqual([
        { a: 'first', b: '' },
        { a: '', b: 'second' },
      ]);
    });

    /** Sends two updaters from one click, each adding one to the count */
    function IncrementTwiceField({ fieldPath, formData, onChange }: FieldProps<number>) {
      return (
        <button
          type='button'
          onClick={() => {
            onChange((current) => (current ?? 0) + 1, fieldPath);
            onChange((current) => (current ?? 0) + 1, fieldPath);
          }}
        >
          {String(formData)}
        </button>
      );
    }
    interface CountData {
      count?: number;
    }
    const countSchema: RJSFSchema = { type: 'object', properties: { count: { type: 'number' } } };
    const countUiSchema = { count: { 'ui:field': IncrementTwiceField } };

    describe("a field's two updaters in one click", () => {
      // Each event is computed from the data the form renders, so both propose `{ count: 2 }`; only a parent that stores
      // the edit, `event.applyTo`, applies the second to the result of the first, however late its update lands
      function CountParent({ store, defer }: { store: 'formData' | 'applyTo'; defer: boolean }) {
        const [data, setData] = useState<CountData>({ count: 1 });
        return (
          <Form<CountData>
            schema={countSchema}
            uiSchema={countUiSchema}
            validator={validator}
            formData={data}
            onChange={(event) => {
              const update = () => setData(store === 'applyTo' ? event.applyTo : event.formData);
              if (defer) {
                startTransition(update);
              } else {
                update();
              }
            }}
          />
        );
      }

      it.each([false, true])('both reach a parent that stores event.applyTo (in a transition: %s)', async (defer) => {
        const { container } = render(<CountParent store='applyTo' defer={defer} />);

        await user.click(screen.getByRole('button', { name: '1' }));

        expect(container.querySelector('button[type=button]')).toHaveTextContent('3');
      });

      it.each([false, true])(
        'only the last reaches a parent that stores event.formData (in a transition: %s)',
        async (defer) => {
          const { container } = render(<CountParent store='formData' defer={defer} />);

          await user.click(screen.getByRole('button', { name: '1' }));

          expect(container.querySelector('button[type=button]')).toHaveTextContent('2');
        },
      );
    });

    it('a setFieldValue from inside onChange proposes from the rendered value, not the proposal being handled', async () => {
      const ref = createRef<Form<Data>>();
      const proposals: Data[] = [];
      function ReentrantParent() {
        const [data, setData] = useState<Data>({ a: '', b: '' });
        return (
          <Form<Data>
            ref={ref}
            schema={schema}
            validator={validator}
            formData={data}
            onChange={(event) => {
              const proposal = event.formData;
              proposals.push(proposal);
              setData(proposal);
              if (proposal.a === 'first' && proposal.b === '') {
                ref.current!.setFieldValue('b', 'derived');
              }
            }}
          />
        );
      }
      const { container } = render(<ReentrantParent />);

      await act(async () => {
        ref.current!.setFieldValue('a', 'first');
      });

      expect(proposals).toEqual([
        { a: 'first', b: '' },
        { a: '', b: 'derived' },
      ]);
      expect(input(container, 'root_a')).toHaveValue('');
      expect(input(container, 'root_b')).toHaveValue('derived');
    });

    it('a parent adds a derived field to the proposal it stores instead of calling setFieldValue', async () => {
      const ref = createRef<Form<Data>>();
      const proposals: Data[] = [];
      function ComposingOnChangeParent() {
        const [data, setData] = useState<Data>({ a: '', b: '' });
        return (
          <Form<Data>
            ref={ref}
            schema={schema}
            validator={validator}
            formData={data}
            onChange={(event) => {
              const proposal = event.formData;
              proposals.push(proposal);
              setData(proposal.a === 'first' ? { ...proposal, b: 'derived' } : proposal);
            }}
          />
        );
      }
      const { container } = render(<ComposingOnChangeParent />);

      await act(async () => {
        ref.current?.setFieldValue('a', 'first');
      });

      expect(proposals).toEqual([{ a: 'first', b: '' }]);
      expect(input(container, 'root_a')).toHaveValue('first');
      expect(input(container, 'root_b')).toHaveValue('derived');
    });

    it('a composing parent keeps both of two path changes made in one tick', async () => {
      const ref = createRef<Form<Data>>();
      const log = createParentLog<Data>();
      const { container } = render(
        <ComposingParent<Data> ref={ref} schema={schema} initialValue={{ a: '', b: '' }} log={log} />,
      );

      await act(async () => {
        ref.current?.setFieldValue('a', 'first');
        ref.current?.setFieldValue('b', 'second');
      });

      expect(log.value).toEqual({ a: 'first', b: 'second' });
      // Each event's `formData` is its own change applied to the rendered data; `applyTo` is what composes them
      expect(log.proposals).toEqual([
        { a: 'first', b: '' },
        { a: '', b: 'second' },
      ]);
      expect(input(container, 'root_a')).toHaveValue('first');
      expect(input(container, 'root_b')).toHaveValue('second');
    });

    it('a composing parent keeps a setFieldValue made from inside onChange', async () => {
      const ref = createRef<Form<Data>>();
      function ReentrantComposingParent() {
        const [data, setData] = useState<Data>({ a: '', b: '' });
        return (
          <Form<Data>
            ref={ref}
            schema={schema}
            validator={validator}
            formData={data}
            onChange={(event) => {
              setData(event.applyTo);
              if (event.formData.a === 'first' && event.formData.b === '') {
                ref.current?.setFieldValue('b', 'derived');
              }
            }}
          />
        );
      }
      const { container } = render(<ReentrantComposingParent />);

      await act(async () => {
        ref.current?.setFieldValue('a', 'first');
      });

      expect(input(container, 'root_a')).toHaveValue('first');
      expect(input(container, 'root_b')).toHaveValue('derived');
    });

    it('applyTo re-applies a change to any base', () => {
      const ref = createRef<Form>();
      const onChange = vi.fn<(event: IChangeEvent) => void>();
      createFormComponent({ ref, schema, initialFormData: { a: '', b: 'kept' }, onChange });

      act(() => ref.current?.setFieldValue('a', 'x'));

      const [event] = onChange.mock.calls[0];
      expect(event.formData).toEqual({ a: 'x', b: 'kept' });
      expect(event.applyTo({ a: 'other', b: 'base' })).toEqual({ a: 'x', b: 'base' });
      expect(event.applyTo(event.formData)).toEqual(event.formData);
      expect(event.formData).toEqual({ a: 'x', b: 'kept' });
    });

    it("a blur's applyTo omits extra data from any base", async () => {
      const onChange = vi.fn<(event: IChangeEvent) => void>();
      createFormComponent({
        schema,
        initialFormData: { a: 'x', extra: 1 },
        omitExtraData: true,
        liveOmit: 'onBlur',
        onChange,
      });

      await user.click(screen.getByDisplayValue('x'));
      await user.tab();

      const [event] = onChange.mock.lastCall ?? [];
      expect(event?.formData).toEqual({ a: 'x' });
      expect(event?.applyTo({ a: 'y', extra: 2 })).toEqual({ a: 'y' });
    });

    it("a reset's and a submit's applyTo hand back their data whatever the base", async () => {
      const ref = createRef<Form>();
      const onChange = vi.fn<(event: IChangeEvent) => void>();
      const onSubmit = vi.fn<(event: IChangeEvent) => void>();
      const { node } = createFormComponent({ ref, schema, initialFormData: { a: 'seed' }, onChange, onSubmit });

      await user.type(screen.getByDisplayValue('seed'), 'x');
      act(() => ref.current?.reset());
      const [resetEvent] = onChange.mock.lastCall ?? [];
      expect(resetEvent?.formData).toEqual({ a: 'seed' });
      expect(resetEvent?.applyTo({ a: 'anything' })).toEqual({ a: 'seed' });

      await submitForm(node, user);
      const [submitEvent] = onSubmit.mock.lastCall ?? [];
      expect(submitEvent?.formData).toEqual({ a: 'seed' });
      expect(submitEvent?.applyTo({ a: 'anything' })).toEqual({ a: 'seed' });
    });

    it('the queue advances past a rejected proposal and a missing handler', async () => {
      const ref = createRef<Form>();
      const { rerender } = render(<Form ref={ref} schema={schema} validator={validator} formData={{ a: '' }} />);
      await act(async () => {
        ref.current!.setFieldValue('a', 'x');
        ref.current!.setFieldValue('b', 'y');
      });
      const onChange = vi.fn();
      rerender(<Form ref={ref} schema={schema} validator={validator} formData={{ a: '' }} onChange={onChange} />);

      await act(async () => {
        ref.current!.setFieldValue('a', 'z');
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].formData).toEqual({ a: 'z' });
    });

    it('every operation in one tick calls onChange with its own proposal', async () => {
      const ref = createRef<Form>();
      const onChange = vi.fn();
      render(<Form ref={ref} schema={schema} validator={validator} formData={{ a: '' }} onChange={onChange} />);

      await act(async () => {
        ref.current!.setFieldValue('a', 'x');
        ref.current!.setFieldValue('b', 'y');
      });

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange.mock.calls[0][0].formData).toEqual({ a: 'x' });
      expect(onChange.mock.calls[1][0].formData).toEqual({ a: '', b: 'y' });
    });
  });

  describe('self-owned forms', () => {
    it('two setFieldValue calls in one tick both land, each reported from the rendered value', () => {
      const ref = createRef<Form>();
      const { onChange, getFormData } = createFormComponent({ ref, schema, initialFormData: { a: '', b: '' } });

      act(() => {
        ref.current?.setFieldValue('a', 'first');
        ref.current?.setFieldValue('b', 'second');
      });

      // The second commit is applied on top of the first, so the form holds both; each event describes its own
      // edit applied to what the render showed, so the events do not end at the committed value
      expect(getFormData()).toEqual({ a: 'first', b: 'second' });
      expect(onChange.mock.calls.map(([event]) => event.formData)).toEqual([
        { a: 'first', b: '' },
        { a: '', b: 'second' },
      ]);
    });

    it('a root replacement from inside onChange composes a derived field', () => {
      const ref = createRef<Form>();
      const reported: unknown[] = [];
      const { getFormData } = createFormComponent({
        ref,
        schema,
        initialFormData: { a: '', b: '' },
        onChange: (event: IChangeEvent) => {
          const data = event.formData;
          reported.push(data);
          if (deepEquals(data, { a: 'first', b: '' })) {
            ref.current?.setFieldValue([], { a: 'first', b: 'derived' });
          }
        },
      });

      act(() => ref.current?.setFieldValue('a', 'first'));

      expect(getFormData()).toEqual({ a: 'first', b: 'derived' });
      expect(reported).toEqual([
        { a: 'first', b: '' },
        { a: 'first', b: 'derived' },
      ]);
    });

    const withDefault: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string', default: 'A' }, b: { type: 'string' } },
    };

    it('adds the defaults to the seed without calling onChange; getFormData() reads the result', () => {
      const ref = createRef<Form>();
      const onChange = vi.fn();
      render(
        <StrictMode>
          <Form
            ref={ref}
            schema={withDefault}
            validator={validator}
            initialFormData={{ b: 'seed' }}
            onChange={onChange}
          />
        </StrictMode>,
      );

      expect(onChange).not.toHaveBeenCalled();
      expect(ref.current!.getFormData()).toEqual({ a: 'A', b: 'seed' });
    });

    it('keeps its data across an unrelated prop change and a later formData prop', async () => {
      const { node, rerender } = createFormComponent({ schema, initialFormData: { a: 'own' } });
      await user.clear(node.querySelector('#root_a')!);
      await user.paste('edited');

      rerender({ schema, initialFormData: { a: 'own' }, className: 'other' });
      expect(node.querySelector('#root_a')).toHaveValue('edited');
      rerender({ schema, formData: { a: 'late' } });

      expect(node.querySelector('#root_a')).toHaveValue('edited');
      expect(warnings.consoleSpy).toHaveBeenCalledTimes(1);
      expect(warnings.consoleSpy.mock.calls[0][0]).toContain('mounted without it');
    });

    it('resets to the latest seed and the current schema, and reports it', async () => {
      const ref = createRef<Form>();
      const { node, onChange, rerender } = createFormComponent({
        ref,
        schema: withDefault,
        initialFormData: { b: 'one' },
      });
      await user.clear(node.querySelector('#root_b')!);
      await user.paste('edited');
      rerender({ ref, schema: withDefault, initialFormData: { b: 'two' } });
      onChange.mockClear();

      act(() => {
        ref.current!.reset();
      });

      expect(node.querySelector('#root_a')).toHaveValue('A');
      expect(node.querySelector('#root_b')).toHaveValue('two');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].formData).toEqual({ a: 'A', b: 'two' });
    });

    it('a schema change that adds a default transforms the held data without calling onChange', () => {
      const ref = createRef<Form>();
      const { node, onChange, rerender } = createFormComponent({ ref, schema, initialFormData: { b: 'kept' } });

      rerender({ ref, schema: withDefault, initialFormData: { b: 'kept' } });

      expect(node.querySelector('#root_a')).toHaveValue('A');
      expect(ref.current!.getFormData()).toEqual({ a: 'A', b: 'kept' });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('development diagnostics', () => {
    it('warns once when both data props are set and ignores the initial data', () => {
      const { node } = createFormComponent({ schema, formData: { a: 'owned' }, initialFormData: { a: 'seed' } });

      expect(node.querySelector('#root_a')).toHaveValue('owned');
      expect(warnings.consoleSpy).toHaveBeenCalledTimes(1);
      expect(warnings.consoleSpy.mock.calls[0][0]).toContain('`initialFormData` is ignored');
    });

    it('warns about a controlled mount without onChange unless the form is readonly or disabled', () => {
      render(<Form schema={schema} validator={validator} formData={{ a: 'x' }} />);
      expect(warnings.consoleSpy).toHaveBeenCalledTimes(1);
      expect(warnings.consoleSpy.mock.calls[0][0]).toContain('without an `onChange` handler');

      warnings.consoleSpy.mockClear();
      render(<Form schema={schema} validator={validator} formData={{ a: 'x' }} readonly />);
      render(<Form schema={schema} validator={validator} formData={{ a: 'x' }} disabled />);
      render(<Form schema={schema} validator={validator} formData={{ a: 'x' }} onChange={noop} />);
      expect(warnings.consoleSpy).not.toHaveBeenCalled();
    });

    it('freezes the formData handed to onChange, leaving non-plain values alone', async () => {
      const when = new Date(0);
      const nested: RJSFSchema = {
        type: 'object',
        properties: { a: { type: 'string' }, list: { type: 'array', items: { type: 'string' } } },
      };
      let seen: IChangeEvent<{ a: string; list: string[]; when: Date }> | undefined;
      render(
        <Form
          schema={nested}
          validator={validator}
          formData={{ a: '', list: ['one'], when }}
          onChange={(event) => {
            seen = event;
          }}
        />,
      );

      await user.click(document.querySelector('#root_a')!);
      await user.paste('x');

      expect(Object.isFrozen(seen!.formData)).toBe(true);
      expect(Object.isFrozen(seen!.formData.list)).toBe(true);
      expect(seen!.formData.when).toBeInstanceOf(Date);
      expect(Object.isFrozen(seen!.formData.when)).toBe(false);
    });

    it('freezes the data a self-owned form commits', async () => {
      const ref = createRef<Form>();
      const { node } = createFormComponent({ ref, schema, initialFormData: { a: '' } });

      await user.click(node.querySelector('#root_a')!);
      await user.paste('x');

      expect(Object.isFrozen(ref.current!.getFormData())).toBe(true);
    });
  });

  describe('asynchronously loaded data', () => {
    it('pattern 1: mounting once the record is there, keyed by the record, switches records by remounting', () => {
      const onChange = vi.fn();
      function Parent({ record, id }: { record?: Data; id: string }) {
        if (!record) {
          return <span>loading</span>;
        }
        return <Form key={id} schema={schema} validator={validator} formData={record} onChange={onChange} />;
      }
      const { rerender, container } = render(<Parent id='1' />);
      expect(container).toHaveTextContent('loading');

      rerender(<Parent id='1' record={{ a: 'one' }} />);
      expect(input(container, 'root_a')).toHaveValue('one');
      rerender(<Parent id='2' record={{ a: 'two' }} />);

      expect(input(container, 'root_a')).toHaveValue('two');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('pattern 2: a complete fallback value keeps the form controlled until the record arrives', () => {
      function Parent({ record }: { record?: Data }) {
        return <Form schema={schema} validator={validator} formData={record ?? {}} onChange={noop} />;
      }
      const { rerender, container } = render(<Parent />);
      expect(input(container, 'root_a')).toHaveValue('');

      rerender(<Parent record={{ a: 'loaded' }} />);

      expect(input(container, 'root_a')).toHaveValue('loaded');
      expect(warnings.consoleSpy).not.toHaveBeenCalled();
    });

    it('the broken version mounts self-owned, ignores the record and warns', () => {
      function Parent({ record }: { record?: Data }) {
        return <Form schema={schema} validator={validator} formData={record} onChange={noop} />;
      }
      const { rerender, container } = render(<Parent />);

      rerender(<Parent record={{ a: 'loaded' }} />);

      expect(input(container, 'root_a')).toHaveValue('');
      expect(warnings.consoleSpy).toHaveBeenCalledTimes(1);
      expect(warnings.consoleSpy.mock.calls[0][0]).toContain('mounted without it');
    });
  });

  describe('nested fields under a declined proposal', () => {
    const oneOfSchema: RJSFSchema = {
      type: 'object',
      properties: {
        status: {
          type: 'object',
          oneOf: [
            { title: 'Approved', type: 'object', properties: { by: { type: 'string' } }, required: ['by'] },
            { title: 'Rejected', type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] },
          ],
        },
      },
    };

    it('a oneOf selector goes back to the option the data fits when the switch is declined', async () => {
      const log = createParentLog<{ status: { by: string } }>();
      const { container } = render(
        <RejectingParent schema={oneOfSchema} initialValue={{ status: { by: 'me' } }} log={log} />,
      );
      const select = container.querySelector<HTMLSelectElement>('#root_status__oneof_select')!;

      await user.selectOptions(select, '1');

      expect(log.proposals).toHaveLength(1);
      expect(select).toHaveValue('0');
      expect(input(container, 'root_status_by')).toHaveValue('me');
    });

    it('a oneOf selector keeps an explicit choice the data still fits when the switch is declined', async () => {
      const ambiguous: RJSFSchema = {
        type: 'object',
        properties: {
          status: {
            type: 'object',
            oneOf: [
              { title: 'A', type: 'object' },
              { title: 'B', type: 'object' },
            ],
          },
        },
      };
      const { container } = render(<RejectingParent schema={ambiguous} initialValue={{ status: {} }} />);
      const select = container.querySelector<HTMLSelectElement>('#root_status__oneof_select')!;

      await user.selectOptions(select, '1');

      expect(select).toHaveValue('1');
    });

    it('a self-owned oneOf switch that leaves the data unchanged keeps the chosen option the data does not fit yet', async () => {
      const rangeSchema: RJSFSchema = {
        type: 'object',
        properties: {
          size: {
            type: 'object',
            oneOf: [
              { title: 'Small', type: 'object', properties: { n: { type: 'number', maximum: 9 } } },
              { title: 'Large', type: 'object', properties: { n: { type: 'number', minimum: 10 } } },
            ],
          },
        },
      };
      const { container } = render(
        <Form schema={rangeSchema} validator={validator} initialFormData={{ size: { n: 5 } }} />,
      );
      const select = container.querySelector<HTMLSelectElement>('#root_size__oneof_select')!;

      await user.selectOptions(select, '1');

      expect(select).toHaveValue('1');
    });

    it('an array add or remove the parent declines leaves no optimistic item behind', async () => {
      const arraySchema: RJSFSchema = { type: 'array', items: { type: 'string' } };
      const log = createParentLog<string[]>();
      const { container } = render(<RejectingParent schema={arraySchema} initialValue={['one', 'two']} log={log} />);

      await user.click(container.querySelector('.rjsf-array-item-add button')!);
      expect(log.proposals).toEqual([['one', 'two', undefined]]);
      expect(container.querySelectorAll('input[type=text]')).toHaveLength(2);

      await user.click(container.querySelector('.rjsf-array-item-remove')!);
      expect(log.proposals.at(-1)).toEqual(['two']);
      expect([...container.querySelectorAll<HTMLInputElement>('input[type=text]')].map((el) => el.value)).toEqual([
        'one',
        'two',
      ]);
    });

    it('an additional property whose rename the parent declines keeps rendering under its old key', async () => {
      const objectSchema: RJSFSchema = { type: 'object', additionalProperties: { type: 'string' } };
      const log = createParentLog<Record<string, string>>();
      const { container } = render(
        <RejectingParent schema={objectSchema} initialValue={{ first: 'one', second: 'two' }} log={log} />,
      );
      const keyInput = container.querySelector<HTMLInputElement>('#root_first-key')!;

      await user.clear(keyInput);
      await user.type(keyInput, 'renamed');
      await user.tab();

      expect(log.proposals.at(-1)).toEqual({ renamed: 'one', second: 'two' });
      expect(container.querySelector('#root_first')).toHaveValue('one');
      expect(container.querySelector('#root_second')).toHaveValue('two');
      expect(container.querySelector('#root_renamed')).toBeNull();
    });

    it('an additional property the parent declined and then accepted when added again renders once', async () => {
      const objectSchema: RJSFSchema = { type: 'object', additionalProperties: { type: 'string' } };
      let isAccepting = false;
      function LateAcceptingParent() {
        const [value, setValue] = useState<Record<string, string>>({});
        return (
          <Form
            schema={objectSchema}
            validator={validator}
            formData={value}
            onChange={(event) => {
              if (isAccepting) {
                setValue(event.formData);
              }
            }}
          />
        );
      }
      const { container } = render(<LateAcceptingParent />);
      const addButton = () => container.querySelector('.rjsf-object-property-expand button')!;

      await user.click(addButton());
      isAccepting = true;
      await user.click(addButton());

      expect(container.querySelectorAll('#root_newKey')).toHaveLength(1);
    });
  });

  describe('reading and submitting the owner', () => {
    it('getFormData() returns the formData prop of a controlled form and the committed data of a self-owned one', async () => {
      const controlled = createRef<Form>();
      const value = { a: 'parent' };
      render(<Form ref={controlled} schema={schema} validator={validator} formData={value} onChange={noop} />);
      expect(controlled.current!.getFormData()).toBe(value);

      const owned = createRef<Form>();
      const { node } = createFormComponent({ ref: owned, schema, initialFormData: { a: 'seed' } });
      await user.clear(node.querySelector('#root_a')!);
      await user.paste('edited');
      expect(owned.current!.getFormData()).toEqual({ a: 'edited' });
    });

    it('a controlled submit with omitExtraData submits the omitted copy without installing it', async () => {
      const onSubmit = vi.fn();
      const onChange = vi.fn();
      const ref = createRef<Form>();
      render(
        <Form
          ref={ref}
          schema={schema}
          validator={validator}
          formData={{ a: 'x', extra: 'gone' }}
          omitExtraData
          onSubmit={onSubmit}
          onChange={onChange}
        />,
      );

      await act(async () => {
        ref.current!.submit();
      });

      expect(onSubmit.mock.calls[0][0].formData).toEqual({ a: 'x' });
      expect(ref.current!.getFormData()).toEqual({ a: 'x', extra: 'gone' });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('errors the form owns under a parent', () => {
    const minLengthSchema: RJSFSchema = {
      type: 'object',
      properties: { foo: { type: 'string', minLength: 5 } },
    };

    function CustomErrorWidget(props: WidgetProps) {
      return (
        <button
          type='button'
          id={`${props.id}-raise`}
          onClick={() => props.onChange(props.value, { __errors: ['custom!'] })}
        >
          raise
        </button>
      );
    }

    function RootErrorField(props: FieldProps) {
      return (
        <button
          type='button'
          id='raise-root'
          onClick={() => props.onChange(props.formData, props.fieldPath, { __errors: ['custom root!'] })}
        >
          raise
        </button>
      );
    }

    function ChangeThenBlurWidget(props: WidgetProps) {
      return (
        <button
          type='button'
          id={`${props.id}-commit`}
          onClick={() => {
            props.onChange('abcdef');
            props.onBlur(props.id, 'abcdef');
          }}
        >
          commit
        </button>
      );
    }

    it('a custom error a field raises over a validation error stays shown', async () => {
      const { container } = render(
        <RejectingParent
          schema={minLengthSchema}
          uiSchema={{ foo: { 'ui:widget': CustomErrorWidget } }}
          initialValue={{ foo: 'a' }}
        />,
      );
      await user.click(container.querySelector('button[type=submit]')!);
      expect(fieldErrorsById(container).root_foo).toEqual(['must NOT have fewer than 5 characters']);

      await user.click(container.querySelector('#root_foo-raise')!);

      expect(fieldErrorsById(container).root_foo).toEqual(['custom!']);
    });

    it('a custom error a field raises over a validation error leaves the other errors as the validator reported them', async () => {
      const pairSchema: RJSFSchema = {
        type: 'object',
        properties: { foo: { type: 'string', minLength: 5 }, bar: { type: 'string', minLength: 5 } },
      };
      const { container, onChange } = createFormComponent({
        schema: pairSchema,
        uiSchema: { foo: { 'ui:widget': CustomErrorWidget } },
        initialFormData: { foo: 'a', bar: 'b' },
      });
      await user.click(container.querySelector('button[type=submit]')!);

      await user.click(container.querySelector('#root_foo-raise')!);

      const { errors } = onChange.mock.lastCall![0] as IChangeEvent;
      expect(errors.map(({ name, property, message }) => ({ name, property, message }))).toEqual([
        { name: undefined, property: '.foo', message: 'custom!' },
        { name: 'minLength', property: '.bar', message: 'must NOT have fewer than 5 characters' },
      ]);
    });

    it('a root custom error blocks submit on a form mounted with data', async () => {
      const onSubmit = vi.fn();
      const onError = vi.fn();
      const { container } = render(
        <RejectingParent
          schema={schema}
          uiSchema={{ 'ui:field': RootErrorField }}
          initialValue={{ a: 'x', b: 'y' }}
          onSubmit={onSubmit}
          onError={onError}
        />,
      );

      await user.click(container.querySelector('#raise-root')!);
      await user.click(container.querySelector('button[type=submit]')!);

      expect(onSubmit).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('a blur in the same handler as a change reports the value before the change and commits after it', async () => {
      const { node, onChange, getFormData } = createFormComponent({
        schema: minLengthSchema,
        uiSchema: { foo: { 'ui:widget': ChangeThenBlurWidget } },
        initialFormData: { foo: 'a' },
        liveValidate: 'onBlur',
      });

      await user.click(screen.getByRole('button', { name: 'commit' }));

      // The blur read the render, which still showed `a`, so its event carries that value and its error; the commit
      // re-applied the blur on top of the change, so the form holds the edit with no error. A parent-owned form
      // would store that event as its value, undoing the change: a widget lets the native blur fire instead
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: { foo: 'a' },
          errors: [expect.objectContaining({ message: 'must NOT have fewer than 5 characters' })],
        }),
        'root_foo',
      );
      expect(getFormData()).toEqual({ foo: 'abcdef' });
      expect(fieldErrorsById(node)).toEqual({});
    });
  });
});

describeOwnerships('operations in one tick', (createFormComponent) => {
  it('a submit in the same tick as an edit submits the rendered data, not the edit', () => {
    const ref = createRef<Form>();
    const { onSubmit, getFormData } = createFormComponent({ ref, schema, initialFormData: { a: 'old' } });

    act(() => {
      ref.current!.setFieldValue('a', 'new');
      ref.current!.submit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].formData).toEqual({ a: 'old' });
    expect(getFormData()).toEqual({ a: 'new' });
  });

  it('a root replacement and a submit of the same value in one tick submit the edit', () => {
    const ref = createRef<Form>();
    const { onSubmit, getFormData } = createFormComponent({ ref, schema, initialFormData: { a: 'old' } });

    act(() => {
      const next = { a: 'new' };
      ref.current?.setFieldValue([], next);
      ref.current?.submit(next);
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].formData).toEqual({ a: 'new' });
    expect(getFormData()).toEqual({ a: 'new' });
  });

  it('submit(formData) and validateForm(formData) act on their argument without installing it', () => {
    const ref = createRef<Form>();
    const required: RJSFSchema = { ...schema, required: ['a', 'b'] };
    const { node, onSubmit, onError, onChange, getFormData } = createFormComponent({
      ref,
      schema: required,
      initialFormData: { a: 'old' },
      noHtml5Validate: true,
    });

    act(() => {
      expect(ref.current?.validateForm({ a: 'draft' })).toBe(false);
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].map(({ message }: { message?: string }) => message)).toEqual([
      "must have required property 'b'",
    ]);
    expect(getFormData()).toEqual({ a: 'old' });
    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      ref.current?.submit({ a: 'draft', b: 'ok' });
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].formData).toEqual({ a: 'draft', b: 'ok' });
    expect(getFormData()).toEqual({ a: 'old' });
    expect(onChange).not.toHaveBeenCalled();
    // The draft's error described data the form does not render, so a later edit shows the errors of its own data
    expect(fieldErrorsById(node)).toEqual({});
  });

  it('a root replacement and a submit of the same value in one tick submit the edit', () => {
    const ref = createRef<Form>();
    const { onSubmit, getFormData } = createFormComponent({ ref, schema, initialFormData: { a: 'old' } });

    act(() => {
      const next = { a: 'new' };
      ref.current?.setFieldValue([], next);
      ref.current?.submit(next);
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].formData).toEqual({ a: 'new' });
    expect(getFormData()).toEqual({ a: 'new' });
  });

  it('submit(formData) and validateForm(formData) act on their argument without installing it', () => {
    const ref = createRef<Form>();
    const required: RJSFSchema = { ...schema, required: ['a', 'b'] };
    const { node, onSubmit, onError, onChange, getFormData } = createFormComponent({
      ref,
      schema: required,
      initialFormData: { a: 'old' },
      noHtml5Validate: true,
    });

    act(() => {
      expect(ref.current?.validateForm({ a: 'draft' })).toBe(false);
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].map(({ message }: { message?: string }) => message)).toEqual([
      "must have required property 'b'",
    ]);
    expect(getFormData()).toEqual({ a: 'old' });
    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      ref.current?.submit({ a: 'draft', b: 'ok' });
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].formData).toEqual({ a: 'draft', b: 'ok' });
    expect(getFormData()).toEqual({ a: 'old' });
    expect(onChange).not.toHaveBeenCalled();
    // A valid submit leaves only the parent's errors on display, so the draft's error is gone with it
    expect(fieldErrorsById(node)).toEqual({});
  });

  it('validateForm(formData) validates an edit made in the same tick, which validateForm() cannot see yet', () => {
    const ref = createRef<Form>();
    const required: RJSFSchema = { ...schema, required: ['a'] };
    const { onError } = createFormComponent({ ref, schema: required, initialFormData: {}, noHtml5Validate: true });
    const results: (boolean | undefined)[] = [];

    act(() => {
      const next = { a: 'new' };
      ref.current?.setFieldValue([], next);
      results.push(ref.current?.validateForm(), ref.current?.validateForm(next));
    });

    expect(results).toEqual([false, true]);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('an invalid submit in the same tick as an edit reports the edited data and lets later operations run', () => {
    const ref = createRef<Form>();
    const required: RJSFSchema = { ...schema, required: ['a', 'b'] };
    const { onSubmit, onError, onChange, getFormData } = createFormComponent({
      ref,
      schema: required,
      initialFormData: {},
      noHtml5Validate: true,
    });

    act(() => {
      const next = { a: 'new' };
      ref.current?.setFieldValue([], next);
      ref.current?.submit(next);
      ref.current!.setFieldValue('b', 'later');
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toHaveLength(1);
    expect(onChange).toHaveBeenCalledTimes(2);
    // Each edit was proposed from the rendered value; what the form holds afterwards is the owner's business,
    // see the self-owned suite for the composition its updaters give it
    expect(getFormData()).toEqual(expect.objectContaining({ b: 'later' }));
  });

  it('a submit whose validation throws lets later operations run', async () => {
    const ref = createRef<Form>();
    const { node, getFormData } = createFormComponent({
      ref,
      schema,
      initialFormData: { a: 'old' },
      noHtml5Validate: true,
      customValidate: () => {
        throw new Error('boom');
      },
    });

    // React reports an error thrown from an event handler instead of throwing it to the dispatcher
    const reported: unknown[] = [];
    const report = (event: ErrorEvent) => {
      event.preventDefault();
      reported.push(event.error);
    };
    window.addEventListener('error', report);
    try {
      await user.click(node.querySelector('button[type=submit]')!);
    } finally {
      window.removeEventListener('error', report);
    }
    act(() => ref.current!.setFieldValue('a', 'new'));

    expect(reported).toEqual([new Error('boom')]);

    expect(getFormData()).toEqual({ a: 'new' });
  });

  it('a submit in the same tick as an edit whose validation throws keeps the form mounted', async () => {
    const ref = createRef<Form>();
    function EditThenSubmit(props: WidgetProps) {
      return (
        <button
          type='button'
          id={`${props.id}-go`}
          onClick={() => {
            ref.current!.setFieldValue('a', 'edited');
            ref.current!.submit();
          }}
        >
          go
        </button>
      );
    }
    const { getFormData } = createFormComponent({
      ref,
      schema,
      uiSchema: { a: { 'ui:widget': EditThenSubmit } },
      initialFormData: { a: 'old' },
      noHtml5Validate: true,
      customValidate: () => {
        throw new Error('boom');
      },
    });

    // The submit runs from the DOM event `submit()` dispatches, whose handler's error React reports to `window`
    const reported: unknown[] = [];
    const report = (event: ErrorEvent) => {
      event.preventDefault();
      reported.push(event.error);
    };
    window.addEventListener('error', report);
    try {
      await user.click(screen.getByRole('button', { name: 'go' }));
    } finally {
      window.removeEventListener('error', report);
    }

    expect(reported).toEqual([new Error('boom')]);
    expect(ref.current).not.toBeNull();
    act(() => ref.current!.setFieldValue('a', 'later'));
    expect(getFormData()).toEqual({ a: 'later' });
  });

  it('a second edit in one tick whose validation throws keeps the form mounted', () => {
    const ref = createRef<Form>();
    const { getFormData } = createFormComponent({
      ref,
      schema,
      initialFormData: { a: 'old' },
      liveValidate: 'onChange',
      customValidate: (formData, errors) => {
        if ((formData as Data).a === 'second') {
          throw new Error('boom');
        }
        return errors;
      },
    });

    // The handle method validates in the caller's own call, so the throw reaches the caller
    expect(() =>
      act(() => {
        ref.current!.setFieldValue('a', 'first');
        ref.current!.setFieldValue('a', 'second');
      }),
    ).toThrow('boom');
    expect(ref.current).not.toBeNull();
    act(() => ref.current!.setFieldValue('a', 'later'));
    expect(getFormData()).toEqual({ a: 'later' });
  });

  it('a blur queued after two edits leaves the last edit live validated', async () => {
    function EditTwiceThenBlur(props: WidgetProps) {
      return (
        <button
          type='button'
          id={`${props.id}-commit`}
          onClick={() => {
            props.onChange('abcde');
            props.onChange('ab');
            props.onBlur(props.id, 'ab');
          }}
        >
          commit
        </button>
      );
    }
    const { node } = createFormComponent({
      schema: { type: 'object', properties: { foo: { type: 'string', minLength: 5 } } },
      uiSchema: { foo: { 'ui:widget': EditTwiceThenBlur } },
      liveValidate: 'onChange',
      omitExtraData: true,
      liveOmit: 'onBlur',
      initialFormData: { foo: 'abcdef' },
    });

    await user.click(node.querySelector('#root_foo-commit')!);

    expect(fieldErrorsById(node)).toEqual({ root_foo: ['must NOT have fewer than 5 characters'] });
  });
});

describe('submitting a self-owned form with omitExtraData', () => {
  it('keeps the omitted copy of the data it held, and leaves it alone for submit(formData)', async () => {
    const ref = createRef<Form>();
    const { node, onSubmit, getFormData } = createFormComponent({
      ref,
      schema,
      initialFormData: { a: 'kept', extra: 1 },
      omitExtraData: true,
    });

    await submitForm(node, user);
    expect(onSubmit.mock.lastCall?.[0].formData).toEqual({ a: 'kept' });
    expect(getFormData()).toEqual({ a: 'kept' });

    act(() => ref.current?.submit({ a: 'draft', extra: 2 }));
    expect(onSubmit.mock.lastCall?.[0].formData).toEqual({ a: 'draft' });
    expect(getFormData()).toEqual({ a: 'kept' });
  });
});

/** Every callback is called from the handler that caused it, so a throw propagates out of that handler: to the
 * caller of a handle method, and to `window`, where React reports it, for a DOM event. Neither unmounts the form.
 */
describe('a throwing callback on a self-owned form', () => {
  /** Collects what React reports to `window` while `run` runs */
  async function reportedBy(run: () => Promise<void>) {
    const reported: unknown[] = [];
    const report = (event: ErrorEvent) => {
      event.preventDefault();
      reported.push(event.error);
    };
    window.addEventListener('error', report);
    try {
      await run();
    } finally {
      window.removeEventListener('error', report);
    }
    return reported;
  }

  it('an onChange that throws keeps the form mounted', () => {
    const ref = createRef<Form>();
    const { getFormData } = createFormComponent({
      ref,
      schema,
      initialFormData: { a: 'old' },
      onChange: ({ formData }: IChangeEvent) => {
        if ((formData as Data | undefined)?.a === 'first') {
          throw new Error('boom');
        }
      },
    });

    expect(() => act(() => ref.current?.setFieldValue('a', 'first'))).toThrow('boom');
    expect(ref.current).not.toBeNull();
    act(() => ref.current!.setFieldValue('a', 'later'));
    expect(getFormData()).toEqual({ a: 'later' });
  });

  it('an onSubmit that throws keeps the form mounted', async () => {
    const ref = createRef<Form>();
    const { node, getFormData } = createFormComponent({
      ref,
      schema,
      initialFormData: { a: 'old' },
      onSubmit: () => {
        throw new Error('boom');
      },
    });

    expect(await reportedBy(() => submitForm(node, user))).toEqual([new Error('boom')]);
    expect(ref.current).not.toBeNull();
    act(() => ref.current!.setFieldValue('a', 'later'));
    expect(getFormData()).toEqual({ a: 'later' });
  });

  describe('an onError that throws keeps the form mounted', () => {
    const renderInvalid = () => {
      const ref = createRef<Form>();
      const rendered = createFormComponent({
        ref,
        schema: { type: 'object', properties: { a: { type: 'string', minLength: 5 } } },
        initialFormData: { a: 'x' },
        noHtml5Validate: true,
        onError: () => {
          throw new Error('boom');
        },
      });
      return { ref, ...rendered };
    };

    it('on an invalid submit', async () => {
      const { ref, node, getFormData } = renderInvalid();

      expect(await reportedBy(() => submitForm(node, user))).toEqual([new Error('boom')]);
      expect(ref.current).not.toBeNull();
      act(() => ref.current!.setFieldValue('a', 'later'));
      expect(getFormData()).toEqual({ a: 'later' });
    });

    it('on a programmatic validateForm()', () => {
      const { ref, getFormData } = renderInvalid();

      expect(() => act(() => ref.current?.validateForm())).toThrow('boom');
      expect(ref.current).not.toBeNull();
      act(() => ref.current!.setFieldValue('a', 'later'));
      expect(getFormData()).toEqual({ a: 'later' });
    });
  });
});
