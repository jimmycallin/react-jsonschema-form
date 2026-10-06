import { use, useLayoutEffect, useMemo, useRef } from 'react';
import type { FieldPath } from '@rjsf/utils';

import FormDataContext from '../components/FormDataContext.ts';

/** What a container field's event handlers read instead of render-time props. Each committed render installs the
 * field's view from a layout Effect, so an abandoned render never publishes one. Callers memoize `value`, so the
 * Effect runs only when the view changed.
 *
 * `source` is the `formData` prop as rendered. `Form` compares it with its own committed data at `fieldPath` to tell an
 * ordinary field from one a custom parent field transformed (a sorted copy, say), whose rendered view is authoritative.
 */
export default function useFieldView<V extends { source: unknown }>(fieldPath: FieldPath, value: V) {
  const access = use(FormDataContext);
  const rendered = useRef(value);
  // The view a handler proposed in this tick, valid until `Form` drops the proposal (see `FormDataAccess.epoch()`)
  const advanced = useRef<{ view: V; epoch: number } | undefined>(undefined);
  useLayoutEffect(() => {
    rendered.current = value;
  }, [value]);
  return useMemo(() => {
    const read = () =>
      advanced.current && advanced.current.epoch === access?.epoch() ? advanced.current.view : rendered.current;
    return {
      read,
      /** The field's current data: `Form`'s latest edit, or `fallback`, the view's own data, when the field shows a
       * transformed view or renders outside a `Form`
       */
      readData: <D>(fallback: D) => (access ? access.readField(fieldPath, read().source, fallback) : fallback),
      /** The field's current errors, with the same choice between `Form`'s latest and `fallback` */
      readErrors: <E>(fallback: E) => (access ? access.readErrors(fieldPath, read().source, fallback) : fallback),
      /** Records the view a handler just proposed, so a second handler in the same event builds on it, as `Form` builds
       * on the proposal itself. Call it before `onChange`, so a render the proposal causes drops the record with it.
       */
      advance: (next: V) => {
        if (access) {
          advanced.current = { view: next, epoch: access.epoch() };
        }
      },
    };
  }, [access, fieldPath]);
}
