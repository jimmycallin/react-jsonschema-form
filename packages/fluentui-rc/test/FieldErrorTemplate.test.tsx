import { getTestRegistry } from '@rjsf/core/testing';
import { render } from '@testing-library/react';

import FieldErrorTemplate from '../src/FieldErrorTemplate/index.ts';

describe('FieldErrorTemplate', () => {
  it('renders no entry for an empty error', () => {
    const { container } = render(
      <FieldErrorTemplate errors={['', 'too short']} id='root' schema={{}} registry={getTestRegistry({})} />,
    );

    expect(container.querySelectorAll('#root__error > li')).toHaveLength(1);
    expect(container.querySelector('#root__error')).toHaveTextContent('too short');
  });
});
