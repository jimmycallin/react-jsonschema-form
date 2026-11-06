import { getTestRegistry } from '@rjsf/core/testing';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import { ClearButton } from '../src/IconButton/IconButton.tsx';
import Form from '../src/index.ts';

describe('IconButton', () => {
  it('gives each array item button the class the array item template hands it', () => {
    const schema: RJSFSchema = { type: 'array', items: { type: 'string' } };
    const uiSchema: UiSchema = { 'ui:options': { copyable: true } };

    const { container } = render(
      <Form schema={schema} uiSchema={uiSchema} initialFormData={['a', 'b']} validator={validator} />,
    );

    for (const className of [
      'rjsf-array-item-move-up',
      'rjsf-array-item-move-down',
      'rjsf-array-item-copy',
      'rjsf-array-item-remove',
    ]) {
      expect(container.querySelectorAll(`button.${className}`)).toHaveLength(2);
    }
  });

  it('keeps the class it is handed on the clear button', () => {
    const { container } = render(<ClearButton className='rjsf-btn-clear' registry={getTestRegistry({})} />);

    expect(container.querySelector('button')).toHaveClass('rjsf-btn-clear', 'btn');
  });
});
