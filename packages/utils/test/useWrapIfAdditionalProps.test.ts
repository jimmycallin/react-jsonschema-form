/** @vitest-environment jsdom */
/* oxlint-disable typescript/no-deprecated -- this file tests the fallbacks to the deprecated displayLabel */
import { renderHook } from '@testing-library/react';

import type {
  Registry,
  ResolvedPresentationDeclaration,
  RJSFMarkedSchema,
  UseWrapIfAdditionalPropsOptions,
  WrapIfAdditionalTemplateProps,
} from '../src/index.ts';
import {
  ADDITIONAL_PROPERTY_FLAG,
  englishStringTranslator,
  errorId,
  resolveFieldPresentation,
  useWrapIfAdditionalProps,
} from '../src/index.ts';

const registry = { translateString: englishStringTranslator } as Registry;
const additionalSchema: RJSFMarkedSchema = { type: 'string', [ADDITIONAL_PROPERTY_FLAG]: true };
const TEMPLATE: ResolvedPresentationDeclaration = {
  label: 'template',
  description: 'template',
  errors: 'template',
  help: 'template',
  labelledBy: 'for',
};

function makeProps(overrides: Partial<WrapIfAdditionalTemplateProps> = {}): WrapIfAdditionalTemplateProps {
  return {
    id: 'root_foo',
    label: 'foo',
    keyName: 'foo',
    hasErrors: false,
    readonly: false,
    disabled: false,
    schema: additionalSchema,
    uiSchema: {},
    registry,
    onKeyRename: vi.fn(),
    onKeyRenameBlur: vi.fn(),
    onRemoveProperty: vi.fn(),
    children: null,
    ...overrides,
  };
}

function render(props: WrapIfAdditionalTemplateProps, options?: UseWrapIfAdditionalPropsOptions) {
  return renderHook(() => useWrapIfAdditionalProps(props, options)).result.current;
}

describe('useWrapIfAdditionalProps()', () => {
  it('gives the key input and the remove button their props, labelling the key by displayLabel without a plan', () => {
    const props = makeProps({ displayLabel: true, required: true });
    const result = render(props);
    expect(result).toMatchObject({
      additional: true,
      keyId: 'root_foo__key',
      keyLabel: 'foo Key',
      hasKeyLabel: true,
      hasDescription: false,
      keyErrorAttributes: {},
      keySelectProps: undefined,
    });
    expect(result.keyInputProps).toEqual({
      id: 'root_foo__key',
      name: 'root_foo__key',
      type: 'text',
      defaultValue: 'foo',
      required: true,
      disabled: false,
      'aria-label': undefined,
      onBlur: props.onKeyRenameBlur,
    });
    expect(result.removeButtonProps).toEqual({
      id: 'root_foo__remove',
      className: 'rjsf-object-property-remove',
      disabled: false,
      onClick: props.onRemoveProperty,
      uiSchema: {},
      registry,
    });
  });

  it('names an unlabelled key input by its label', () => {
    const result = render(makeProps());
    expect(result.hasKeyLabel).toBe(false);
    expect(result.keyInputProps['aria-label']).toBe('foo Key');
  });

  it('says a field that is not an additional property is none', () => {
    expect(render(makeProps({ schema: { type: 'string' } })).additional).toBe(false);
  });

  it('disables the key input and the remove button of a read-only field, which renames nothing on blur', () => {
    const result = render(makeProps({ readonly: true }));
    expect(result.keyInputProps.disabled).toBe(true);
    expect(result.keyInputProps.onBlur).toBeUndefined();
    expect(result.removeButtonProps.disabled).toBe(true);
  });

  it('disables both for a disabled field, and each for a field missing its callback', () => {
    const disabled = render(makeProps({ disabled: true }));
    expect(disabled.keyInputProps.disabled).toBe(true);
    expect(disabled.removeButtonProps.disabled).toBe(true);
    const root = render(makeProps({ onKeyRenameBlur: undefined, onRemoveProperty: undefined }));
    expect(root.keyInputProps.disabled).toBe(true);
    expect(root.removeButtonProps.disabled).toBe(true);
  });

  it('marks a forbidden key invalid and described by the row errors', () => {
    const result = render(makeProps({ keyNotAllowed: true, hasErrors: true }));
    const attributes = { 'aria-describedby': errorId('root_foo'), 'aria-invalid': true };
    expect(result.keyErrorAttributes).toEqual(attributes);
    expect(result.keyInputProps).toMatchObject(attributes);
  });

  describe('with a plan', () => {
    it('says the value has a description whoever draws it, which rawDescription misses for one a widget draws', () => {
      const selfDrawn = resolveFieldPresentation({
        id: 'root_foo',
        declaration: { ...TEMPLATE, description: 'self' },
        label: 'foo',
        description: 'Bar',
      });
      expect(render(makeProps({ presentation: selfDrawn, rawDescription: '' })).hasDescription).toBe(true);
      const none = resolveFieldPresentation({ id: 'root_foo', declaration: TEMPLATE, label: 'foo' });
      expect(render(makeProps({ presentation: none, rawDescription: 'Bar' })).hasDescription).toBe(false);
    });

    it('labels the key wherever the value is labelled', () => {
      const presentation = resolveFieldPresentation({ id: 'root_foo', declaration: TEMPLATE, label: 'foo' });
      expect(render(makeProps({ presentation, displayLabel: false })).hasKeyLabel).toBe(true);
    });
  });

  it('says the value has a description from rawDescription without a plan', () => {
    expect(render(makeProps({ rawDescription: 'Bar' })).hasDescription).toBe(true);
  });

  describe('keySelectProps', () => {
    const propertyNamesEnum = ['foo', 'bar'];

    it('leaves the label beside the dropdown to the template by default', () => {
      const props = makeProps({ propertyNamesEnum, displayLabel: true, required: true, keyNotAllowed: true });
      expect(render(props).keySelectProps).toEqual({
        id: 'root_foo__key',
        label: 'foo Key',
        hideLabel: true,
        labelledByTemplate: true,
        value: 'foo',
        propertyNamesEnum,
        onKeyRename: props.onKeyRename,
        errorAttributes: {},
        disabled: false,
        readonly: false,
        required: true,
        registry,
      });
      expect(render(makeProps({ propertyNamesEnum })).keySelectProps).toMatchObject({
        hideLabel: true,
        labelledByTemplate: false,
      });
    });

    it('has the dropdown draw the label where the theme asks it to', () => {
      const options = { keySelectDrawsLabel: true };
      expect(render(makeProps({ propertyNamesEnum, displayLabel: true }), options).keySelectProps).toMatchObject({
        hideLabel: false,
        labelledByTemplate: false,
      });
      expect(render(makeProps({ propertyNamesEnum }), options).keySelectProps).toMatchObject({
        hideLabel: true,
        labelledByTemplate: false,
      });
    });
  });
});
