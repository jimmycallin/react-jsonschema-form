import noop from 'lodash/noop';
import type { MockInstance } from 'vitest';

import type { GlobalUISchemaOptions, UIOptionsType, UiSchema } from '../src';
import { getUiOptions, isUiSchema } from '../src';

/** Reads a nested uiSchema out of the fixture below; nested values on a `UiSchema` are `unknown`, and some of the
 * fixtures below are deliberately malformed, so the guard is how they get narrowed for the call
 */
function nested(value: unknown): UiSchema {
  return isUiSchema(value) ? value : {};
}

const uiSchema: UiSchema = {
  widgetText: {
    'ui:widget': 'select',
  },
  widgetObject: {
    'ui:widget': {
      component: 'radio',
    },
  },
  arrayObject: {
    'ui:addable': true,
  },
  optionsObject: {
    'ui:options': {
      widget: 'hidden',
      disabled: true,
    },
  },
  multiOptions: {
    'ui:submitButtonProps': {
      norender: true,
    },
    'ui:readonly': true,
    'ui:options': 'text',
    junk: 'not-shown',
  },
};

const globalOptions: GlobalUISchemaOptions = {
  addable: false,
  copyable: true,
};

const results: Record<string, UIOptionsType> = {
  widgetText: { widget: 'select' },
  widgetObject: {},
  arrayObject: { addable: true, copyable: true },
  optionsObject: { widget: 'hidden', disabled: true },
  multiOptions: {
    submitButtonProps: { norender: true },
    readonly: true,
    options: 'text',
  },
};

describe('getUiOptions()', () => {
  let consoleErrorSpy: MockInstance;
  beforeAll(() => {
    // spy on console.error() and make it do nothing to avoid making noise in the test
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
  });
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });
  it('returns empty options with no uiSchema', () => {
    expect(getUiOptions()).toEqual({});
  });
  it('returns globalOptions when uiSchema is undefined', () => {
    expect(getUiOptions(undefined, globalOptions)).toEqual(globalOptions);
  });
  it('returns globalOptions when uiSchema is null', () => {
    expect(getUiOptions(null as unknown as UiSchema, globalOptions)).toEqual(globalOptions);
  });
  it('returns array object as options', () => {
    expect(getUiOptions(nested(uiSchema.arrayObject), globalOptions)).toEqual(results.arrayObject);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
  it('returns widget text as options', () => {
    expect(getUiOptions(nested(uiSchema.widgetText))).toEqual(results.widgetText);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
  it('returns widget object as empty, with error', () => {
    expect(getUiOptions(nested(uiSchema.widgetObject))).toEqual(results.widgetObject);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Setting options via ui:widget object is no longer supported, use ui:options instead',
    );
  });
  it('returns options object as options', () => {
    expect(getUiOptions(nested(uiSchema.optionsObject))).toEqual(results.optionsObject);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
  it('returns multiple options as options', () => {
    expect(getUiOptions(nested(uiSchema.multiOptions))).toEqual(results.multiOptions);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});
