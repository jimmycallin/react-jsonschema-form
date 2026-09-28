import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import DateWidget from '../src/widgets/DateWidget/DateWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

describe('DateWidget', () => {
  test('commits the new value after the parent changes it', async () => {
    const onChange = vi.fn();
    const schema = { type: 'string' as const, format: 'date' };
    const { container, rerender } = render(
      <DateWidget {...makeWidgetMockProps({ value: '2016-04-05', onChange, schema })} />,
    );
    rerender(<DateWidget {...makeWidgetMockProps({ value: '2020-01-02', onChange, schema })} />);

    await user.click(container.querySelector('[role=button]')!);
    await user.click(document.body);

    expect(onChange).toHaveBeenCalledWith(new Date('2020-01-02').toISOString());
  });
});
