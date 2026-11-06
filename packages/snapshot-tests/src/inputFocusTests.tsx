import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, waitFor } from '@testing-library/react';

/** Checks that a theme's text inputs and textarea report the field's form data to `onFocus` and `onBlur`, as every
 * other widget does, rather than the text the input shows: a number for a number field and a `ui:emptyValue` of
 * `null`, which the input shows as no text, for an empty one
 *
 * @param Form - The theme's `Form`
 */
export function inputFocusTests(Form: ComponentType<FormProps>) {
  describe('text input focus and blur', () => {
    test.each<[string, RJSFSchema, UiSchema, unknown, unknown]>([
      ['a number field reports its number', { type: 'number' }, {}, 5, 5],
      ['an updown field reports its number', { type: 'number' }, { 'ui:widget': 'updown' }, 5, 5],
      [
        'an empty updown field reports its ui:emptyValue',
        { type: 'number' },
        { 'ui:widget': 'updown', 'ui:emptyValue': null },
        undefined,
        null,
      ],
      ['an empty text field reports its ui:emptyValue', { type: 'string' }, { 'ui:emptyValue': null }, undefined, null],
      ['a password field reports its form data', { type: 'string' }, { 'ui:widget': 'password' }, 'secret', 'secret'],
      [
        'an empty password field reports its ui:emptyValue',
        { type: 'string' },
        { 'ui:widget': 'password', 'ui:emptyValue': null },
        undefined,
        null,
      ],
      ['a textarea reports its text', { type: 'string' }, { 'ui:widget': 'textarea' }, 'notes', 'notes'],
      [
        'an empty textarea reports its ui:emptyValue',
        { type: 'string' },
        { 'ui:widget': 'textarea', 'ui:emptyValue': null },
        undefined,
        null,
      ],
    ])('%s', async (_, schema, uiSchema, initialFormData, reported) => {
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      const { container } = render(
        <Form
          schema={schema}
          uiSchema={uiSchema}
          validator={validator}
          initialFormData={initialFormData}
          onFocus={onFocus}
          onBlur={onBlur}
        />,
      );
      const input = container.querySelector<HTMLElement>('#root');
      // Focused through the DOM, as user-event isn't among this package's peer dependencies
      act(() => input?.focus());
      // Waited for, as a library's numeric input, such as Mantine's, reports its focus after a timeout
      await waitFor(() => expect(onFocus).toHaveBeenCalledWith('root', reported));
      act(() => input?.blur());

      expect(onBlur).toHaveBeenCalledWith('root', reported);
    });
  });
}
