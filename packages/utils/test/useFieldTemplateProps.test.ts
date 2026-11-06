/** @vitest-environment jsdom */
/* oxlint-disable typescript/no-deprecated -- this file tests the fallbacks to the deprecated displayLabel */
import { renderHook } from '@testing-library/react';
import { createElement } from 'react';

import type {
  FieldTemplateProps,
  Registry,
  ResolvedPresentationDeclaration,
  UseFieldTemplatePropsOptions,
  WrapIfAdditionalTemplateProps,
} from '../src/index.ts';
import { resolveFieldPresentation, useFieldTemplateProps } from '../src/index.ts';

function RegistryWrap({ children }: WrapIfAdditionalTemplateProps) {
  return children;
}

function OwnWrap({ children }: WrapIfAdditionalTemplateProps) {
  return children;
}

// Only the parts of a registry the hook reads
const registry = {
  templates: { WrapIfAdditionalTemplate: RegistryWrap },
  globalUiOptions: { label: false },
} as Registry;

const TEMPLATE: ResolvedPresentationDeclaration = {
  label: 'template',
  description: 'template',
  errors: 'template',
  help: 'template',
  labelledBy: 'for',
};

function makeProps(overrides: Partial<FieldTemplateProps> = {}): FieldTemplateProps {
  return {
    fieldPath: ['foo'],
    id: 'root_foo',
    label: 'Foo',
    keyName: 'foo',
    children: createElement('input'),
    readonly: false,
    disabled: false,
    hasErrors: false,
    schema: { type: 'string' },
    uiSchema: {},
    registry,
    onChange: vi.fn(),
    ...overrides,
  };
}

function render(props: FieldTemplateProps, options?: UseFieldTemplatePropsOptions) {
  return renderHook(() => useFieldTemplateProps(props, options)).result.current;
}

describe('useFieldTemplateProps()', () => {
  it('hands the WrapIfAdditionalTemplate exactly its own props, leaving out the parts the template draws', () => {
    const onKeyRename = vi.fn();
    const onKeyRenameBlur = vi.fn();
    const onRemoveProperty = vi.fn();
    const props = makeProps({
      classNames: 'foo',
      style: { color: 'red' },
      rawDescription: 'Bar',
      displayLabel: true,
      rawErrors: ['error'],
      required: true,
      hideError: false,
      hasErrors: true,
      onKeyRename,
      onKeyRenameBlur,
      onRemoveProperty,
      propertyNamesEnum: ['foo'],
      keyNotAllowed: false,
      description: createElement('p'),
      help: createElement('p'),
      errors: createElement('p'),
      errorSchema: {},
      rawHelp: 'Help',
      formData: 'value',
      hidden: false,
    });
    const result = render(props);
    expect(result.wrapProps).toEqual({
      id: 'root_foo',
      classNames: 'foo',
      style: { color: 'red' },
      label: 'Foo',
      keyName: 'foo',
      rawDescription: 'Bar',
      displayLabel: true,
      rawErrors: ['error'],
      required: true,
      readonly: false,
      disabled: false,
      hideError: false,
      hasErrors: true,
      presentation: undefined,
      schema: { type: 'string' },
      uiSchema: {},
      registry,
      onKeyRename,
      onKeyRenameBlur,
      onRemoveProperty,
      propertyNamesEnum: ['foo'],
      keyNotAllowed: false,
    });
    expect(result.hidden).toBe(false);
    expect(result.WrapIfAdditionalTemplate).toBe(RegistryWrap);
  });

  it('reads the ui options over the global ones, and the WrapIfAdditionalTemplate the uiSchema names', () => {
    const result = render(makeProps({ uiSchema: { 'ui:WrapIfAdditionalTemplate': OwnWrap }, hidden: true }));
    expect(result.uiOptions).toEqual({ label: false, WrapIfAdditionalTemplate: OwnWrap });
    expect(result.WrapIfAdditionalTemplate).toBe(OwnWrap);
    expect(result.hidden).toBe(true);
  });

  describe('without a plan', () => {
    it('draws the label displayLabel asks for, with its props', () => {
      const result = render(makeProps({ displayLabel: true, required: true }));
      expect(result.drawsLabel).toBe(true);
      expect(result.labelProps).toEqual({ label: 'Foo', id: undefined, htmlFor: 'root_foo', required: true });
      expect(render(makeProps()).drawsLabel).toBe(false);
      expect(render(makeProps({ displayLabel: true, label: '' })).drawsLabel).toBe(false);
    });

    it('leaves the label to a checkbox', () => {
      expect(render(makeProps({ displayLabel: true, uiSchema: { 'ui:widget': 'checkbox' } })).drawsLabel).toBe(false);
    });

    it('draws none where the theme widgets draw their own', () => {
      expect(render(makeProps({ displayLabel: true }), { widgetsDrawLabels: true }).drawsLabel).toBe(false);
    });
  });

  describe('with a plan', () => {
    const presentation = resolveFieldPresentation({ id: 'root_foo', declaration: TEMPLATE, label: 'Foo' });

    it('draws the label the plan gives the template, whatever displayLabel says', () => {
      const result = render(makeProps({ presentation, displayLabel: false, uiSchema: { 'ui:widget': 'checkbox' } }));
      expect(result.drawsLabel).toBe(true);
      expect(result.labelProps).toEqual({
        label: 'Foo',
        id: presentation.label.id,
        htmlFor: 'root_foo',
        required: false,
      });
      expect(render(makeProps({ presentation }), { widgetsDrawLabels: true }).drawsLabel).toBe(true);
    });

    it('draws none the plan keeps from the template', () => {
      const hidden = resolveFieldPresentation({ id: 'root_foo', declaration: TEMPLATE, label: 'Foo', showLabel: false });
      expect(render(makeProps({ presentation: hidden, displayLabel: true })).drawsLabel).toBe(false);
    });
  });
});
