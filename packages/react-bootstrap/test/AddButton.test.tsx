import { getTestRegistry } from '@rjsf/core/testing';
import { render } from '@testing-library/react';

import AddButton from '../src/AddButton/index.ts';

describe('AddButton', () => {
  it('adds no class of its own beyond the button classes when it is given none', () => {
    const { container } = render(<AddButton registry={getTestRegistry({})} />);

    expect(container.querySelector('button')).toHaveAttribute('class', 'ml-1 btn btn-primary');
  });

  it('keeps the class it is given', () => {
    const { container } = render(<AddButton className='rjsf-array-item-add' registry={getTestRegistry({})} />);

    expect(container.querySelector('button')).toHaveAttribute('class', 'ml-1 rjsf-array-item-add btn btn-primary');
  });
});
