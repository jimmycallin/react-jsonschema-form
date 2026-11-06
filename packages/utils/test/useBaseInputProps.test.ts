/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react';

import type { BaseInputTemplateProps, Registry } from '../src/index.ts';
import {
  ariaDescribedByIds,
  englishStringTranslator,
  examplesId,
  useBaseInputProps,
  useTextareaWidgetProps,
} from '../src/index.ts';

const registry = { translateString: englishStringTranslator } as Registry;

function makeProps(overrides: Partial<BaseInputTemplateProps> = {}): BaseInputTemplateProps {
  return {
    id: 'root',
    name: 'root',
    label: 'Name',
    schema: { type: 'string' },
    uiSchema: {},
    value: 'Ada',
    options: {},
    onChange: vi.fn(),
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    registry,
    ...overrides,
  };
}

function render(props: BaseInputTemplateProps, plainNativeInput?: boolean) {
  return renderHook(() => useBaseInputProps(props, plainNativeInput)).result.current;
}

describe('useBaseInputProps()', () => {
  it('gives the input its id, name, value, type and state', () => {
    const result = render(makeProps({ required: true, autofocus: true, placeholder: 'Your name', htmlName: 'n' }));
    expect(result).toMatchObject({
      id: 'root',
      name: 'n',
      required: true,
      disabled: false,
      readOnly: false,
      autoFocus: true,
      placeholder: 'Your name',
      value: 'Ada',
      listId: undefined,
      showClearButton: false,
    });
    expect(result.inputProps.type).toBe('text');
    expect(result.ariaProps['aria-describedby']).toBe(ariaDescribedByIds('root'));
  });

  it('names the input by its id without an htmlName, and shows no form data as an empty string', () => {
    const result = render(makeProps({ value: undefined }));
    expect(result.name).toBe('root');
    expect(result.value).toBe('');
  });

  it('steps a numeric input by any amount only as a plain native input', () => {
    const props = makeProps({ schema: { type: 'number' }, type: 'number', value: 1 });
    const native = render(props);
    expect(native.inputProps).toMatchObject({ type: 'number', step: 'any' });
    expect(render(props, false).inputProps.step).not.toBe('any');
    expect(native.title).toBeUndefined();
  });

  it('lists the schema examples, and describes the input by their datalist', () => {
    const result = render(makeProps({ schema: { type: 'string', examples: ['Ada', 'Grace'] } }));
    expect(result.listId).toBe(examplesId('root'));
    expect(result.exampleSuggestions).toEqual(['Ada', 'Grace']);
    expect(result.ariaProps['aria-describedby']).toContain(examplesId('root'));
  });

  it('offers a clear button where asked, only for an enabled, changeable input that shows a value', () => {
    const options = { allowClearTextInputs: true };
    expect(render(makeProps({ options })).showClearButton).toBe(true);
    expect(render(makeProps({ options, value: '' })).showClearButton).toBe(false);
    expect(render(makeProps({ options, disabled: true })).showClearButton).toBe(false);
    expect(render(makeProps({ options, readonly: true })).showClearButton).toBe(false);
  });

  it('reports an emptied input as ui:emptyValue, and any other value as it is', () => {
    const props = makeProps({ options: { emptyValue: 'none' } });
    const { onChange } = render(props);
    onChange('');
    onChange(null);
    onChange(undefined);
    onChange(3);
    expect(vi.mocked(props.onChange).mock.calls).toEqual([['none'], ['none'], ['none'], [3]]);
  });

  it('clears the field to ui:emptyValue, stopping the click from going further', () => {
    const props = makeProps({ options: { emptyValue: 'none' } });
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() };
    const { onClear } = render(props);
    onClear(event);
    onClear();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(vi.mocked(props.onChange).mock.calls).toEqual([['none'], ['none']]);
  });

  it('reports the form data on focus and blur, a read-only input included', () => {
    const props = makeProps({ readonly: true });
    const { onFocus, onBlur } = render(props);
    onFocus();
    onBlur();
    expect(props.onFocus).toHaveBeenCalledWith('root', 'Ada');
    expect(props.onBlur).toHaveBeenCalledWith('root', 'Ada');
  });

  it.each([{ disabled: true }, { readonly: true }])('changes nothing while %o', (state) => {
    const props = makeProps(state);
    const { onChange, onClear } = render(props);
    onChange('x');
    onClear();
    expect(props.onChange).not.toHaveBeenCalled();
  });

  it('reports no focus or blur while disabled', () => {
    const props = makeProps({ disabled: true });
    const { onFocus, onBlur } = render(props);
    onFocus();
    onBlur();
    expect(props.onFocus).not.toHaveBeenCalled();
    expect(props.onBlur).not.toHaveBeenCalled();
  });
});

describe('useTextareaWidgetProps()', () => {
  it('reads a whole positive ui:options.rows, and describes the textarea by no datalist', () => {
    const schema = { type: 'string' as const, examples: ['Ada'] };
    const result = renderHook(() => useTextareaWidgetProps(makeProps({ schema, options: { rows: 3 } }))).result.current;
    expect(result.rows).toBe(3);
    expect(result.value).toBe('Ada');
    expect(result.ariaProps['aria-describedby']).not.toContain(examplesId('root'));
  });

  it.each([2.5, 0, -1, undefined])('draws no rows of its own for ui:options.rows %s', (rows) => {
    expect(renderHook(() => useTextareaWidgetProps(makeProps({ options: { rows } }))).result.current.rows).toBe(
      undefined,
    );
  });
});
