/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react';

import type { Registry, WidgetProps } from '../src/index.ts';
import { ariaDescribedByIds, englishStringTranslator, useRangeWidgetProps } from '../src/index.ts';

const registry = { translateString: englishStringTranslator } as Registry;

function makeProps(overrides: Partial<WidgetProps> = {}): WidgetProps {
  return {
    id: 'root',
    name: 'root',
    label: 'Volume',
    schema: { type: 'number', minimum: 0, maximum: 10, multipleOf: 2 },
    uiSchema: {},
    value: 4,
    options: {},
    onChange: vi.fn(),
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    registry,
    ...overrides,
  };
}

function render(props: WidgetProps) {
  return renderHook(() => useRangeWidgetProps(props)).result.current;
}

describe('useRangeWidgetProps()', () => {
  it('gives the control its id, name, range and aria attributes', () => {
    const result = render(makeProps({ required: true, autofocus: true, htmlName: 'volume' }));
    expect(result).toMatchObject({
      id: 'root',
      name: 'volume',
      required: true,
      disabled: false,
      autoFocus: true,
      value: 4,
      spec: { min: 0, max: 10, step: 2 },
    });
    expect(result.ariaProps['aria-describedby']).toBe(ariaDescribedByIds('root'));
  });

  it('names the control by its id without an htmlName, and reads a numeric string as its number', () => {
    const result = render(makeProps({ value: '6' }));
    expect(result.name).toBe('root');
    expect(result.value).toBe(6);
  });

  it('holds no value where the form data holds no number', () => {
    expect(render(makeProps({ value: undefined })).value).toBeUndefined();
  });

  it('disables the control when the field is disabled or read-only', () => {
    expect(render(makeProps({ disabled: true })).disabled).toBe(true);
    expect(render(makeProps({ readonly: true })).disabled).toBe(true);
  });

  it('writes a number, or a string where the schema stores one', () => {
    const numberProps = makeProps();
    render(numberProps).onChange(8);
    expect(numberProps.onChange).toHaveBeenCalledWith(8);

    const stringProps = makeProps({ schema: { type: 'string' } });
    render(stringProps).onChange(8);
    expect(stringProps.onChange).toHaveBeenCalledWith('8');
  });

  it('writes ui:emptyValue for no value', () => {
    const props = makeProps({ options: { emptyValue: 0 } });
    render(props).onChange(undefined);
    expect(props.onChange).toHaveBeenCalledWith(0);
  });

  it('reports the form data on focus and blur', () => {
    const props = makeProps();
    const { onFocus, onBlur } = render(props);
    onFocus();
    onBlur();
    expect(props.onFocus).toHaveBeenCalledWith('root', 4);
    expect(props.onBlur).toHaveBeenCalledWith('root', 4);
  });

  it.each([{ disabled: true }, { readonly: true }])('reports nothing while %o', (state) => {
    const props = makeProps(state);
    const { onChange, onFocus, onBlur } = render(props);
    onChange(2);
    onFocus();
    onBlur();
    expect(props.onChange).not.toHaveBeenCalled();
    expect(props.onFocus).not.toHaveBeenCalled();
    expect(props.onBlur).not.toHaveBeenCalled();
  });
});
