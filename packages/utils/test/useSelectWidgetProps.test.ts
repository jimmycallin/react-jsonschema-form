/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react';

import type { EnumOptionsType, Registry, WidgetProps } from '../src/index.ts';
import { ariaDescribedByIds, englishStringTranslator, useSelectWidgetProps } from '../src/index.ts';

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

function render(props: WidgetProps) {
  return renderHook(() => useSelectWidgetProps(props)).result.current;
}

describe('useSelectWidgetProps()', () => {
  describe('control attributes', () => {
    it('gives the control its id, name, aria attributes and placeholder', () => {
      const result = render(makeProps({ required: true, autofocus: true, placeholder: 'Pick one' }));
      expect(result).toMatchObject({
        id: 'root',
        name: 'root',
        required: true,
        disabled: false,
        autoFocus: true,
        placeholder: 'Pick one',
        multiple: false,
        showPlaceholderOption: true,
      });
      expect(result.ariaProps['aria-describedby']).toBe(ariaDescribedByIds('root'));
    });

    it('names the control by its htmlName', () => {
      expect(render(makeProps({ htmlName: 'color' })).name).toBe('color');
    });

    it('disables the control when the field is disabled or read-only', () => {
      expect(render(makeProps({ disabled: true })).disabled).toBe(true);
      expect(render(makeProps({ readonly: true })).disabled).toBe(true);
    });

    it('offers no empty choice when the schema has a default or the select is multiple', () => {
      expect(render(makeProps({ schema: { default: 'r' } })).showPlaceholderOption).toBe(false);
      expect(render(makeProps({ multiple: true })).showPlaceholderOption).toBe(false);
    });

    it('gives the SelectedOptionDescription its props', () => {
      const props = makeProps({ value: 'g' });
      expect(render(props).descriptionProps).toEqual({
        id: 'root',
        multiple: false,
        options: props.options,
        registry,
        uiSchema: {},
        value: 'g',
        hideLabel: false,
        presentation: undefined,
      });
    });
  });

  describe('value', () => {
    it('encodes a single value by index', () => {
      expect(render(makeProps({ value: 'b' })).value).toBe('2');
    });

    it('encodes a single value as itself under realValue', () => {
      expect(render(makeProps({ value: 'b', options: { enumOptions, optionValueFormat: 'realValue' } })).value).toBe(
        'b',
      );
    });

    it('holds the empty string for a single select with no selection', () => {
      expect(render(makeProps()).value).toBe('');
    });

    it('holds no value that no option carries', () => {
      const options = { enumOptions, optionValueFormat: 'realValue' as const };
      expect(render(makeProps({ value: 'zzz', options })).value).toBe('');
      expect(render(makeProps({ multiple: true, value: ['zzz', 'g'], options })).value).toEqual(['g']);
    });

    it('encodes a multiple value as an array, in enum order', () => {
      const result = render(makeProps({ multiple: true, value: ['b', 'r'] }));
      expect(result.multiple).toBe(true);
      expect(result.value).toEqual(['0', '2']);
    });

    it('holds an empty array for a multiple select with no selection', () => {
      expect(render(makeProps({ multiple: true })).value).toEqual([]);
    });
  });

  describe('options', () => {
    it('lists every option encoded, with ui:enumDisabled applied', () => {
      const result = render(makeProps({ options: { enumOptions, enumDisabled: ['g'] } }));
      expect(result.options).toEqual([
        { value: '0', label: 'Red', disabled: false, index: 0 },
        { value: '1', label: 'Green', disabled: true, index: 1 },
        { value: '2', label: 'Blue', disabled: false, index: 2 },
      ]);
      expect(result.groupedOptions).toEqual(result.options);
    });

    it('groups the options by optgroups, keeping the flat list in enum order', () => {
      const result = render(
        makeProps({ options: { enumOptions, optionValueFormat: 'realValue', optgroups: { Cool: ['b', 'g'] } } }),
      );
      expect(result.groupedOptions).toEqual([
        {
          label: 'Cool',
          options: [
            { value: 'b', label: 'Blue', disabled: false, index: 2 },
            { value: 'g', label: 'Green', disabled: false, index: 1 },
          ],
        },
        { value: 'r', label: 'Red', disabled: false, index: 0 },
      ]);
      expect(result.options.map((option) => option.value)).toEqual(['r', 'g', 'b']);
    });

    it('lists no options when there are no enumOptions', () => {
      const result = render(makeProps({ options: {} }));
      expect(result.options).toEqual([]);
      expect(result.groupedOptions).toEqual([]);
    });
  });

  describe('onChange', () => {
    it('decodes a single value', () => {
      const props = makeProps();
      render(props).onChange('1');
      expect(props.onChange).toHaveBeenCalledWith('g');
    });

    it('decodes a cleared single value as ui:emptyValue', () => {
      const props = makeProps({ options: { enumOptions, emptyValue: 'none' } });
      const { onChange } = render(props);
      onChange(null);
      onChange('');
      expect(props.onChange).toHaveBeenNthCalledWith(1, 'none');
      expect(props.onChange).toHaveBeenNthCalledWith(2, 'none');
    });

    it('decodes a cleared multiple value as an empty array', () => {
      const props = makeProps({ multiple: true });
      render(props).onChange(undefined);
      expect(props.onChange).toHaveBeenCalledWith([]);
    });

    it('puts a multiple selection back into enum order, leaving out values no option holds', () => {
      const props = makeProps({
        multiple: true,
        options: { enumOptions, optionValueFormat: 'realValue', optgroups: { Cool: ['b', 'g'] }, emptyValue: 'x' },
      });
      render(props).onChange(['b', 'unknown', 'r', 'g']);
      expect(props.onChange).toHaveBeenCalledWith(['r', 'g', 'b']);
    });

    it.each([{ disabled: true }, { readonly: true }])('reports nothing while %o', (state) => {
      const props = makeProps(state);
      const { onChange, onFocus, onBlur } = render(props);
      onChange('1');
      onFocus();
      onBlur();
      expect(props.onChange).not.toHaveBeenCalled();
      expect(props.onFocus).not.toHaveBeenCalled();
      expect(props.onBlur).not.toHaveBeenCalled();
    });
  });

  describe('onFocus and onBlur', () => {
    it('report the form data', () => {
      const props = makeProps({ value: 'r' });
      const { onFocus, onBlur } = render(props);
      onFocus();
      onBlur();
      expect(props.onFocus).toHaveBeenCalledWith('root', 'r');
      expect(props.onBlur).toHaveBeenCalledWith('root', 'r');
    });

    it('report ui:emptyValue when nothing is selected', () => {
      const props = makeProps({ options: { enumOptions, emptyValue: 'none' } });
      const { onFocus, onBlur } = render(props);
      onFocus();
      onBlur();
      expect(props.onFocus).toHaveBeenCalledWith('root', 'none');
      expect(props.onBlur).toHaveBeenCalledWith('root', 'none');
    });

    it('do not throw when the widget has no onFocus or onBlur', () => {
      const { onFocus, onBlur } = render(makeProps({ onFocus: undefined, onBlur: undefined }));
      expect(() => {
        onFocus();
        onBlur();
      }).not.toThrow();
    });
  });
});
