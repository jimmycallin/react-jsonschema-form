import { use, useLayoutEffect, useMemo, useRef } from 'react';
import type { FieldPath } from '@rjsf/utils';

import FormDataContext from '../components/FormDataContext.ts';

/** What a container field's event handlers read instead of render-time props. Each committed render installs the
 * field's view from a layout Effect, so an abandoned render never publishes one.
 *
 * `source` is the `formData` prop as rendered. `Form` compares it with its own committed data at `fieldPath` to tell an
 * ordinary field from one a custom parent field transformed (a sorted copy, say), whose rendered view is authoritative.
 */
export default function useFieldView<V extends { source: unknown }>(fieldPath: FieldPath, value: V) {
  const access = use(FormDataContext);
  const view = useRef(value);
  useLayoutEffect(() => {
    view.current = value;
  }, [value]);
  return useMemo(
    () => ({
      read: () => view.current,
      /** The field's current data: `Form`'s latest edit in a self-owned form, or `fallback`, the view's own data,
       * when the field shows a transformed view or renders outside a `Form`
       */
      readData: <D>(fallback: D) => (access ? access.readField(fieldPath, view.current.source, fallback) : fallback),
      /** The field's current errors, with the same choice between `Form`'s latest and `fallback` */
      readErrors: <E>(fallback: E) => (access ? access.readErrors(fieldPath, view.current.source, fallback) : fallback),
      /** Records an edit the handler just proposed, so the next handler in the same event builds on it. Only a
       * self-owned form has already applied the edit; a parent-owned one has not, and its next command starts again from
       * the rendered value, so advancing there would pair the rendered data with the proposal's keys and errors.
       */
      advance: (next: V) => {
        if (access?.chainsEdits()) {
          view.current = next;
        }
      },
    }),
    [access, fieldPath],
  );
}
