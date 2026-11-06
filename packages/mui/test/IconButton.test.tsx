import { getTestRegistry } from '@rjsf/core/testing';
import { render } from '@testing-library/react';

import { RemoveButton } from '../src/IconButton/IconButton.tsx';

describe('IconButton', () => {
  it('is small unless the uiSchema says otherwise', () => {
    const { container } = render(<RemoveButton registry={getTestRegistry({})} />);

    expect(container.querySelector('button')).toHaveClass('MuiIconButton-sizeSmall');
  });

  it("takes its size from the uiSchema's mui options", () => {
    const { container } = render(
      <RemoveButton uiSchema={{ 'ui:options': { mui: { size: 'large' } } }} registry={getTestRegistry({})} />,
    );

    expect(container.querySelector('button')).toHaveClass('MuiIconButton-sizeLarge');
  });
});
