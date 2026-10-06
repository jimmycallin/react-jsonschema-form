import { Profiler } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';
import { buildRegistry } from '../src/Theme.ts';
import { AcceptingParent, input } from './testUtils.tsx';

// Spied rather than replaced, so the form builds its real registry and every call is counted
vi.mock('../src/Theme.ts', { spy: true });

const user = userEvent.setup();

const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string', minLength: 3 } } };

/** Counts the commits React makes for the tree inside it */
function countCommits() {
  const onRender = vi.fn();
  return { onRender, commits: () => onRender.mock.calls.length, reset: () => onRender.mockClear() };
}

describe('render cost of one update', () => {
  it('commits once for a keystroke in a controlled, live-validated form', async () => {
    const profile = countCommits();
    const { container } = render(
      <Profiler id='form' onRender={profile.onRender}>
        <AcceptingParent schema={schema} initialValue={{ name: '' }} liveValidate='onChange' />
      </Profiler>,
    );
    profile.reset();

    await user.type(input(container, 'root_name'), 'x');

    expect(profile.commits()).toBe(1);
  });

  it('commits once for an unrelated prop change on a self-owned form', () => {
    const profile = countCommits();
    const element = (idPrefix: string) => (
      <Profiler id='form' onRender={profile.onRender}>
        <Form schema={schema} validator={validator} initialFormData={{ name: '' }} idPrefix={idPrefix} />
      </Profiler>
    );
    const { rerender } = render(element('root'));
    profile.reset();

    rerender(element('other'));

    expect(profile.commits()).toBe(1);
  });

  it('derives the render state once per keystroke render', async () => {
    const { container } = render(<Form schema={schema} validator={validator} initialFormData={{ name: '' }} />);
    vi.mocked(buildRegistry).mockClear();

    await user.type(input(container, 'root_name'), 'x');

    // Once for the edited data in `applyChange()`, once for the render; the render restart `setCache` causes reuses it
    expect(vi.mocked(buildRegistry).mock.calls.length).toBe(2);
  });
});
