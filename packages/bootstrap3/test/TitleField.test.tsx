import { getTestRegistry } from '@rjsf/core/testing';
import { render } from '@testing-library/react';

import TitleField from '../src/TitleField.tsx';

describe('TitleField', () => {
  it('renders a legend inside a fieldset', () => {
    const { container } = render(
      <TitleField id='root__title' title='Pet' schema={{}} registry={getTestRegistry({})} />,
    );

    expect(container.querySelector('legend')).toHaveTextContent('Pet');
  });

  it('renders a div, not a legend, outside a fieldset', () => {
    const { container } = render(
      <TitleField id='root__title' title='Pet' outsideFieldset schema={{}} registry={getTestRegistry({})} />,
    );

    expect(container.querySelector('legend')).toBeNull();
    expect(container.querySelector('div.rjsf-title')).toHaveTextContent('Pet');
    expect(container.querySelector('#root__title')).toHaveTextContent('Pet');
  });
});
