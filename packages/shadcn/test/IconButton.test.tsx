import { getTestRegistry } from '@rjsf/core/testing';
import { render } from '@testing-library/react';

import { RemoveButton } from '../src/IconButton/IconButton.tsx';

describe('RemoveButton', () => {
  it('keeps the class it is given alongside its destructive border', () => {
    const { container } = render(<RemoveButton className='rjsf-array-item-remove' registry={getTestRegistry({})} />);

    expect(container.querySelector('button')).toHaveClass('rjsf-array-item-remove', 'border-destructive');
  });
});
