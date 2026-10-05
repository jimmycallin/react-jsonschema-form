import { useLayoutEffect, useState } from 'react';

function createView<T>(initial: T) {
  let value = initial;
  return {
    read: () => value,
    configure: (next: T) => {
      value = next;
    },
  };
}

/** A field's committed presentation, read only by event handlers. Abandoned renders cannot publish a view. */
export default function useCommittedView<T>(value: T) {
  // oxlint-disable-next-line react/hook-use-state -- private event model, not rendered state
  const [model] = useState(() => createView(value));
  useLayoutEffect(() => {
    model.configure(value);
  }, [model, value]);
  return model;
}
