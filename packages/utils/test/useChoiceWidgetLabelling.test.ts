/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react';

import type { FieldPresentation, Registry, ResolvedPresentationDeclaration, WidgetProps } from '../src/index.ts';
import {
  englishStringTranslator,
  resolveFieldPresentation,
  useCheckboxesWidgetProps,
  useRadioWidgetProps,
} from '../src/index.ts';

const ID = 'root_foo';
const LABEL_ID = `${ID}__label`;

function plan(label: ResolvedPresentationDeclaration['label']): FieldPresentation {
  return resolveFieldPresentation({
    id: ID,
    declaration: {
      label,
      description: 'template',
      errors: 'template',
      help: 'template',
      labelledBy: 'aria-labelledby',
    },
    label: 'Foo',
    errors: ['is required'],
  });
}

const registry = { translateString: englishStringTranslator } as Registry;

/** The labelling a radio group or a group of checkboxes that draws its own label gets from its hook */
function getGroupLabelling(
  props: Pick<WidgetProps, 'id' | 'label' | 'hideLabel' | 'presentation'>,
  role: 'radiogroup' | 'group',
) {
  const widgetProps: WidgetProps = {
    name: 'foo',
    schema: {},
    uiSchema: {},
    value: undefined,
    options: { enumOptions: [] },
    onChange: vi.fn(),
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    registry,
    ...props,
  };
  const useHook = role === 'radiogroup' ? useRadioWidgetProps : useCheckboxesWidgetProps;
  const { drawsLabel, labelId, groupProps, optionProps } = renderHook(() => useHook(widgetProps, { drawsLabel: true }))
    .result.current;
  return { drawsLabel, labelId, group: groupProps, option: optionProps };
}

describe('the label a choice widget that draws its own label is given', () => {
  it('draws the label its plan gives the widget, and names the group by it', () => {
    expect(getGroupLabelling({ id: ID, label: 'Foo', presentation: plan('self') }, 'radiogroup')).toEqual({
      drawsLabel: true,
      labelId: LABEL_ID,
      group: { role: 'radiogroup', 'aria-labelledby': LABEL_ID, 'aria-invalid': true },
      option: { 'aria-describedby': `${ID}__error` },
    });
  });

  it('draws the label under the id its plan gives it, beneath a label a component above draws', () => {
    const option = resolveFieldPresentation({
      id: ID,
      declaration: { label: 'self', description: 'template', errors: 'template', help: 'template', labelledBy: 'for' },
      label: 'Bar',
      inherited: plan('self'),
    });
    const { labelId, group } = getGroupLabelling({ id: ID, label: 'Bar', presentation: option }, 'radiogroup');
    expect(labelId).toBe(`${ID}__optionLabel`);
    expect(group['aria-labelledby']).toBe(`${ID}__optionLabel`);
  });

  it('draws no label its plan gives the template, and names the group by the one the template draws', () => {
    expect(getGroupLabelling({ id: ID, label: 'Foo', presentation: plan('template') }, 'group')).toEqual({
      drawsLabel: false,
      labelId: LABEL_ID,
      group: { role: 'group', 'aria-labelledby': LABEL_ID },
      option: { 'aria-describedby': `${ID}__error`, 'aria-invalid': true },
    });
  });

  it('gives the id of the label the template draws, numbered beneath a label a component above draws', () => {
    const option = resolveFieldPresentation({
      id: ID,
      declaration: {
        label: 'template',
        description: 'template',
        errors: 'template',
        help: 'template',
        labelledBy: 'aria-labelledby',
      },
      label: 'Bar',
      inherited: plan('self'),
    });
    const { drawsLabel, labelId, group } = getGroupLabelling({ id: ID, label: 'Bar', presentation: option }, 'group');
    expect(drawsLabel).toBe(false);
    expect(labelId).toBe(`${ID}__optionLabel`);
    expect(group['aria-labelledby']).toBe(`${ID}__optionLabel`);
  });

  it('draws the label of a widget rendered without a plan, and names the group by it', () => {
    expect(getGroupLabelling({ id: ID, label: 'Foo' }, 'group').group).toEqual({
      role: 'group',
      'aria-labelledby': LABEL_ID,
    });
  });

  it.each([
    ['whose label is hidden', { label: 'Foo', hideLabel: true }],
    ['with no label text', { label: '' }],
  ])('leaves a group %s unnamed, rather than named by a label that is not drawn', (_, labelProps) => {
    expect(getGroupLabelling({ id: ID, ...labelProps }, 'group')).toEqual({
      drawsLabel: false,
      labelId: LABEL_ID,
      group: { role: 'group' },
      option: { 'aria-describedby': `${ID}__error ${ID}__description ${ID}__help` },
    });
  });
});
