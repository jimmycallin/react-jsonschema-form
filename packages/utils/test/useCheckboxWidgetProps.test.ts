/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react';

import type { Registry, WidgetProps } from '../src/index.ts';
import {
  ariaDescribedByIds,
  englishStringTranslator,
  resolveFieldPresentation,
  useCheckboxWidgetProps,
} from '../src/index.ts';

const registry = { translateString: englishStringTranslator } as Registry;

function makeProps(overrides: Partial<WidgetProps> = {}): WidgetProps {
  return {
    id: 'root',
    name: 'root',
    label: 'Agree',
    schema: { type: 'boolean' },
    uiSchema: {},
    value: true,
    options: {},
    onChange: vi.fn(),
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    registry,
    ...overrides,
  };
}

function render(props: WidgetProps) {
  return renderHook(() => useCheckboxWidgetProps(props)).result.current;
}

describe('useCheckboxWidgetProps()', () => {
  it('gives the checkbox its id, name, state and aria attributes, and draws the label', () => {
    const result = render(makeProps({ autofocus: true, htmlName: 'agree' }));
    expect(result).toMatchObject({
      id: 'root',
      name: 'agree',
      checked: true,
      required: false,
      disabled: false,
      autoFocus: true,
      drawsLabel: true,
    });
    expect(result.ariaProps['aria-describedby']).toBe(ariaDescribedByIds('root'));
  });

  it('is unchecked for falsy form data, and named by its id without an htmlName', () => {
    const result = render(makeProps({ value: undefined }));
    expect(result.checked).toBe(false);
    expect(result.name).toBe('root');
  });

  it('is required only where the schema requires true', () => {
    expect(render(makeProps({ required: true })).required).toBe(false);
    expect(render(makeProps({ required: true, schema: { type: 'boolean', const: true } })).required).toBe(true);
    expect(render(makeProps({ schema: { type: 'boolean', const: true } })).required).toBe(false);
  });

  it('draws no label its plan gives the template', () => {
    const presentation = resolveFieldPresentation({
      id: 'root',
      declaration: {
        label: 'template',
        description: 'template',
        errors: 'template',
        help: 'template',
        labelledBy: 'for',
      },
      label: 'Agree',
    });
    expect(render(makeProps({ presentation })).drawsLabel).toBe(false);
  });

  it('reports whether it is checked, and the form data on focus and blur', () => {
    const props = makeProps();
    const { onChange, onFocus, onBlur } = render(props);
    onChange(false);
    onFocus();
    onBlur();
    expect(props.onChange).toHaveBeenCalledWith(false);
    expect(props.onFocus).toHaveBeenCalledWith('root', true);
    expect(props.onBlur).toHaveBeenCalledWith('root', true);
  });

  it.each([{ disabled: true }, { readonly: true }])('is disabled and reports nothing while %o', (state) => {
    const props = makeProps(state);
    const { disabled, onChange, onFocus, onBlur } = render(props);
    onChange(false);
    onFocus();
    onBlur();
    expect(disabled).toBe(true);
    expect(props.onChange).not.toHaveBeenCalled();
    expect(props.onFocus).not.toHaveBeenCalled();
    expect(props.onBlur).not.toHaveBeenCalled();
  });
});
