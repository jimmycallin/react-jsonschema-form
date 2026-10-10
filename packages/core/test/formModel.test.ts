import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import type { FormProps } from '../src/components/Form.tsx';
import { createFormModel } from '../src/components/formModel.ts';
import { initialState } from '../src/components/formState.ts';

const schema: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };

function createModel() {
  const props: FormProps = { schema, validator };
  return { model: createFormModel(props, initialState(props)), props };
}

describe('proposing()', () => {
  it('has the form render only for a view that did not reach the model', () => {
    const { model } = createModel();
    const listener = vi.fn();
    model.subscribe(listener);

    // The edit reached the model, which notified for it
    const reached = model.proposing();
    model.handle.setFieldValue('a', 'x');
    reached();
    expect(listener).toHaveBeenCalledTimes(1);

    // A view the model never heard of, as one a custom parent kept to itself is, has nothing else to render the form
    // for it
    model.proposing()();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('has the form render for a view sent while React commits a render the store asked for', () => {
    const { model, props } = createModel();
    const listener = vi.fn();
    model.subscribe(listener);
    model.handle.setFieldValue('a', 'x');
    const rendered = model.getSnapshot();
    const epoch = model.epoch();

    // A field React cleans up in that commit sends a view to a custom parent, which keeps the change to itself. The
    // commit has yet to reach the model, and it is the only render on its way
    model.proposing()();
    model.committed(props, rendered.state, rendered);

    expect(listener).toHaveBeenCalledTimes(2);
    // The field's record of the view outlives the commit, until the render it asked for
    expect(model.epoch()).toBe(epoch);
  });
});
