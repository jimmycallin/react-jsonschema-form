import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import DateTimeWidget from '../src/widgets/DateTimeWidget/DateTimeWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

describe('DateTimeWidget', () => {
  describe('with schema.format = iso-date-time', () => {
    const schema = { type: 'string' as const, format: 'iso-date-time' };

    test('commits the date-time as a naive local string without a timezone offset', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2016-04-05T14:01:30', onChange, schema })} />,
      );

      await user.click(container.querySelector('[role=button]')!);
      await user.click(screen.getByText('Done'));

      expect(onChange).toHaveBeenCalledWith('2016-04-05T14:01:30');
    });

    test('parses a stored offset value as the naive wall-clock time instead of converting it to local time', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2016-04-05T14:01:30.000Z', onChange, schema })} />,
      );

      await user.click(container.querySelector('[role=button]')!);
      await user.click(screen.getByText('Done'));

      expect(onChange).toHaveBeenCalledWith('2016-04-05T14:01:30');
    });
  });

  describe('with schema.format = date-time', () => {
    const schema = { type: 'string' as const, format: 'date-time' };

    test('still commits the date-time as a UTC ISO string with a timezone offset', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: '2016-04-05T14:01:30.000Z', onChange, schema })} />,
      );

      await user.click(container.querySelector('[role=button]')!);
      await user.click(screen.getByText('Done'));

      expect(onChange).toHaveBeenCalledWith('2016-04-05T14:01:30.000Z');
    });

    test('reports the blur after the pick when a click outside closes the picker', async () => {
      const onChange = vi.fn();
      const onBlur = vi.fn();
      const { container } = render(
        <>
          <DateTimeWidget {...makeWidgetMockProps({ value: '2016-04-05T14:01:30.000Z', onChange, onBlur, schema })} />
          <p>elsewhere</p>
        </>,
      );

      await user.click(container.querySelector('[role=button]')!);
      // Picking a day moves focus into the popup, so the trigger's own blur has already fired, suppressed
      await user.click(screen.getByText('15'));
      await user.click(screen.getByText('elsewhere'));

      expect(onChange).toHaveBeenCalledWith('2016-04-15T14:01:00.000Z');
      expect(onBlur).toHaveBeenCalledTimes(1);
      expect(onBlur.mock.invocationCallOrder[0]).toBeGreaterThan(onChange.mock.invocationCallOrder[0]);
    });

    test('commits an empty string instead of throwing when the stored value is unparsable', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <DateTimeWidget {...makeWidgetMockProps({ value: 'not-a-date', onChange, schema })} />,
      );

      // React routes an error thrown inside a handler to a window `error` event rather than rejecting the
      // promise user-event returns, so the "instead of throwing" half of this test has to listen for that;
      // awaiting the clicks, or wrapping them in `.resolves.not.toThrow()`, would pass either way
      const onWindowError = vi.fn((event: Event) => event.preventDefault());
      window.addEventListener('error', onWindowError);

      try {
        await user.click(container.querySelector('[role=button]')!);
        await user.click(screen.getByText('Done'));
      } finally {
        window.removeEventListener('error', onWindowError);
      }

      expect(onWindowError).not.toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledWith('');
    });
  });
});
