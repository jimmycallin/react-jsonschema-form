/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react';

import type { EnumOptionsType, Registry, WidgetProps } from '../src/index.ts';
import { englishStringTranslator, useCheckboxesWidgetProps } from '../src/index.ts';

const enumOptions: EnumOptionsType[] = [
  { label: 'Red', value: 'r' },
  { label: 'Green', value: 'g' },
  { label: 'Blue', value: 'b' },
];

const registry = { translateString: englishStringTranslator } as Registry;

function makeProps(overrides: Partial<WidgetProps> = {}): WidgetProps {
  return {
    id: 'root',
    name: 'root',
    label: 'Colors',
    schema: {},
    uiSchema: {},
    value: [],
    options: { enumOptions },
    onChange: vi.fn(),
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    registry,
    ...overrides,
  };
}

function render(props: WidgetProps) {
  return renderHook(() => useCheckboxesWidgetProps(props)).result.current;
}

describe('useCheckboxesWidgetProps()', () => {
  it('gives the group its role, and each checkbox whether it is checked', () => {
    const result = render(makeProps({ value: ['b', 'r'] }));
    expect(result.groupProps.role).toBe('group');
    expect(result.value).toEqual(['0', '2']);
    expect(result.options.map((option) => option.checked)).toEqual([true, false, true]);
  });

  it('reads a lone value as a one-item selection', () => {
    expect(render(makeProps({ value: 'g' })).value).toEqual(['1']);
  });

  it('focuses the first enabled checkbox under ui:autofocus, whatever is checked', () => {
    const result = render(makeProps({ autofocus: true, value: ['b'], options: { enumOptions, enumDisabled: ['r'] } }));
    expect(result.options.map((option) => option.autoFocus)).toEqual([false, true, false]);
  });

  it('checks and unchecks an option, reporting the selection in enum order', () => {
    const props = makeProps({ value: ['b'] });
    const [red, , blue] = render(props).options;
    red.onCheckedChange(true);
    blue.onCheckedChange(false);
    expect(props.onChange).toHaveBeenNthCalledWith(1, ['r', 'b']);
    expect(props.onChange).toHaveBeenNthCalledWith(2, []);
  });

  it('decodes a whole selection, and no selection as an empty one', () => {
    const props = makeProps();
    const { onChange } = render(props);
    onChange(['2', '0']);
    onChange(undefined);
    expect(props.onChange).toHaveBeenNthCalledWith(1, ['r', 'b']);
    expect(props.onChange).toHaveBeenNthCalledWith(2, []);
  });

  it('points the group at the label the widget draws, where it asks to draw one', () => {
    const result = renderHook(() => useCheckboxesWidgetProps(makeProps(), { drawsLabel: true })).result.current;
    expect(result.drawsLabel).toBe(true);
    expect(result.groupProps['aria-labelledby']).toBe(result.labelId);
  });

  it('reports nothing while the field is read-only', () => {
    const props = makeProps({ readonly: true });
    const { options } = render(props);
    options[0].onCheckedChange(true);
    options[0].onFocus();
    expect(props.onChange).not.toHaveBeenCalled();
    expect(props.onFocus).not.toHaveBeenCalled();
  });
});
