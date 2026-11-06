import { MantineProvider } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core/testing';
import { render } from '@testing-library/react';

import FieldErrorTemplate from '../src/templates/FieldErrorTemplate.tsx';

describe('FieldErrorTemplate', () => {
  it('renders no line for an empty error', () => {
    const { container } = render(
      <FieldErrorTemplate errors={['', 'too short']} id='root' schema={{}} registry={getTestRegistry({})} />,
      { wrapper: MantineProvider },
    );

    expect(container.querySelector('#root__error br')).toBeNull();
    expect(container.querySelector('#root__error')).toHaveTextContent('too short');
  });
});
