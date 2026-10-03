import { createRef, useLayoutEffect } from 'react';
import validator from '@rjsf/validator-ajv8';
import { act, render } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';

import Form from '../src/index.ts';
import type { FormHandle } from '../src/index.ts';

const schema = { type: 'string' as const };
it('retains the latest committed data after unmount', () => {
  const ref = createRef<FormHandle>();
  const { rerender, unmount } = render(
    <Form ref={ref} schema={schema} validator={validator} formData='old' readonly />,
  );
  const handle = ref.current!;
  rerender(<Form ref={ref} schema={schema} validator={validator} formData='new' readonly />);
  expect(handle.getFormData()).toBe('new');
  unmount();
  expect(handle.getFormData()).toBe('new');
});
it('supports server rendering and hydration with a sibling layout update', async () => {
  const ref = createRef<FormHandle>();
  const seen: unknown[] = [];
  function After() {
    useLayoutEffect(() => {
      ref.current!.setFieldValue([], 'changed');
      seen.push(ref.current!.getFormData());
    }, []);
    return null;
  }
  const tree = (
    <>
      <Form ref={ref} schema={schema} validator={validator} initialFormData='initial' />
      <After />
    </>
  );
  const container = document.createElement('div');
  container.innerHTML = renderToString(tree);
  document.body.append(container);
  const onRecoverableError = vi.fn();
  let root: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, tree, { onRecoverableError });
  });
  expect(ref.current!.getFormData()).toBe('changed');
  expect(seen).toEqual(['initial']);
  expect(onRecoverableError).not.toHaveBeenCalled();
  await act(async () => root!.unmount());
  container.remove();
});
