import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

import type { AnnouncedMove } from './formState.ts';

/** Private event access for container fields, which read the form's current data at their path, edits made since the
 * form last rendered included, instead of the data they rendered
 */
interface FormDataAccess {
  /** Calls `send`, which sends a change that moves the items of the array at `move.fieldPath`. The form moves the
   * errors it holds for those items along when the change for that path reaches it before `send` returns, the way
   * `startTransition()` marks the updates made inside its callback. Only the form holds them all, and a field's
   * `onChange` has no way to say where an item went.
   */
  sendMove(move: AnnouncedMove, send: () => void): void;
  /** The form's current data at `path` */
  readField<D>(path: FieldPath): D;
}
export default createContext<FormDataAccess | undefined>(undefined);
