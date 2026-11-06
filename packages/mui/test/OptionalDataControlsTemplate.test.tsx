import { getTestRegistry } from '@rjsf/core/testing';
import type { IconButtonProps } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';

import OptionalDataControlsTemplate from '../src/OptionalDataControlsTemplate/index.ts';

function CustomRemoveButton({ title, className }: IconButtonProps) {
  return <button type='button' className={className}>{`custom remove: ${title}`}</button>;
}

describe('OptionalDataControlsTemplate', () => {
  it("renders the registry's RemoveButton", () => {
    const registry = getTestRegistry({}, {}, { ButtonTemplates: { RemoveButton: CustomRemoveButton } });

    render(
      <OptionalDataControlsTemplate
        id='root'
        schema={{}}
        label='Remove data'
        registry={registry}
        onRemoveClick={() => {}}
      />,
    );

    expect(screen.getByRole('button')).toHaveTextContent('custom remove: Remove data');
    expect(screen.getByRole('button')).toHaveClass('rjsf-remove-optional-data');
  });
});
