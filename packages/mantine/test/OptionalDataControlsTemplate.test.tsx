import { MantineProvider } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core/testing';
import type { IconButtonProps } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';

import OptionalDataControlsTemplate from '../src/templates/OptionalDataControlsTemplate.tsx';

function CustomAddButton({ title, className }: IconButtonProps) {
  return <button type='button' className={className}>{`custom add: ${title}`}</button>;
}

function CustomRemoveButton({ title, className }: IconButtonProps) {
  return <button type='button' className={className}>{`custom remove: ${title}`}</button>;
}

const registry = getTestRegistry(
  {},
  {},
  { ButtonTemplates: { AddButton: CustomAddButton, RemoveButton: CustomRemoveButton } },
);

const wrapper = MantineProvider;

describe('OptionalDataControlsTemplate', () => {
  it("renders the registry's AddButton", () => {
    render(
      <OptionalDataControlsTemplate id='root' schema={{}} label='Add data' registry={registry} onAddClick={() => {}} />,
      {
        wrapper,
      },
    );

    expect(screen.getByRole('button')).toHaveTextContent('custom add: Add data');
    expect(screen.getByRole('button')).toHaveClass('rjsf-add-optional-data');
  });

  it("renders the registry's RemoveButton", () => {
    render(
      <OptionalDataControlsTemplate
        id='root'
        schema={{}}
        label='Remove data'
        registry={registry}
        onRemoveClick={() => {}}
      />,
      { wrapper },
    );

    expect(screen.getByRole('button')).toHaveTextContent('custom remove: Remove data');
    expect(screen.getByRole('button')).toHaveClass('rjsf-remove-optional-data');
  });
});
