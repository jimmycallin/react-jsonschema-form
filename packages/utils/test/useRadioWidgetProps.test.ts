/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react';

import type { EnumOptionsType, Registry, WidgetProps } from '../src/index.ts';
import { ariaDescribedByIds, englishStringTranslator, optionId, useRadioWidgetProps } from '../src/index.ts';

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
    label: 'Color',
    schema: {},
    uiSchema: {},
    value: undefined,
    options: { enumOptions },
    onChange: vi.fn(),
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    registry,
    ...overrides,
  };
}

function render(props: WidgetProps, drawsLabel?: boolean) {
  return renderHook(() => useRadioWidgetProps(props, drawsLabel === undefined ? undefined : { drawsLabel })).result
    .current;
}

describe('useRadioWidgetProps()', () => {
  it('gives the group its id, name, role and aria attributes', () => {
    const result = render(makeProps({ required: true, htmlName: 'color' }));
    expect(result).toMatchObject({ id: 'root', name: 'color', required: true, disabled: false, inline: false });
    expect(result.groupProps.role).toBe('radiogroup');
    expect(result.optionProps['aria-describedby']).toBe(ariaDescribedByIds('root'));
  });

  it('disables the group when the field is disabled or read-only', () => {
    expect(render(makeProps({ disabled: true })).disabled).toBe(true);
    expect(render(makeProps({ readonly: true })).disabled).toBe(true);
  });

  it('lays the options out inline under ui:options.inline', () => {
    expect(render(makeProps({ options: { enumOptions, inline: true } })).inline).toBe(true);
  });

  it('lists every option with its control id, encoded value, and whether it is checked or disabled', () => {
    const result = render(makeProps({ value: 'g', options: { enumOptions, enumDisabled: ['b'] } }));
    expect(result.value).toBe('1');
    expect(
      result.options.map(({ id, value, label, checked, disabled, autoFocus }) => ({
        id,
        value,
        label,
        checked,
        disabled,
        autoFocus,
      })),
    ).toEqual([
      { id: optionId('root', 0), value: '0', label: 'Red', checked: false, disabled: false, autoFocus: false },
      { id: optionId('root', 1), value: '1', label: 'Green', checked: true, disabled: false, autoFocus: false },
      { id: optionId('root', 2), value: '2', label: 'Blue', checked: false, disabled: true, autoFocus: false },
    ]);
  });

  it('holds the empty string with no option checked', () => {
    expect(render(makeProps()).value).toBe('');
  });

  it('focuses the checked option under ui:autofocus', () => {
    const result = render(makeProps({ autofocus: true, value: 'b' }));
    expect(result.options.map((option) => option.autoFocus)).toEqual([false, false, true]);
  });

  it('decodes a choice, and no choice as ui:emptyValue', () => {
    const props = makeProps({ options: { enumOptions, emptyValue: 'none', optionValueFormat: 'realValue' } });
    const { onChange } = render(props);
    onChange('b');
    onChange(null);
    expect(props.onChange).toHaveBeenNthCalledWith(1, 'b');
    expect(props.onChange).toHaveBeenNthCalledWith(2, 'none');
  });

  it("reports an option's own value on its focus and blur", () => {
    const props = makeProps({ value: 'r' });
    const [, green] = render(props).options;
    green.onFocus();
    green.onBlur();
    expect(props.onFocus).toHaveBeenCalledWith('root', 'g');
    expect(props.onBlur).toHaveBeenCalledWith('root', 'g');
  });

  it.each([{ disabled: true }, { readonly: true }])('reports nothing while %o', (state) => {
    const props = makeProps(state);
    const { onChange, options } = render(props);
    onChange('1');
    options[0].onFocus();
    options[0].onBlur();
    expect(props.onChange).not.toHaveBeenCalled();
    expect(props.onFocus).not.toHaveBeenCalled();
    expect(props.onBlur).not.toHaveBeenCalled();
  });

  it('points the group at the label the widget draws, where it asks to draw one', () => {
    const drawn = render(makeProps(), true);
    expect(drawn.drawsLabel).toBe(true);
    expect(drawn.groupProps['aria-labelledby']).toBe(drawn.labelId);

    const left = render(makeProps());
    expect(left.drawsLabel).toBe(false);
    expect(left.groupProps['aria-labelledby']).toBeUndefined();
  });

  it('lists no options when there are no enumOptions', () => {
    expect(render(makeProps({ options: {} })).options).toEqual([]);
  });
});
