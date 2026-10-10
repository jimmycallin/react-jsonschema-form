import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

import type { AnnouncedMove } from './formState.ts';

/** Private event access for container fields. A field rendered with the form's own data reads the form's latest data,
 * edits made since the form last rendered included; a field handed a view of that data keeps to its view.
 */
interface FormDataAccess {
  /** Changes at every commit of the form, and with it ends a field's record of a view it sent since the form last
   * rendered (see `useFieldView()`)
   */
  epoch(): number;
  /** Called before a field sends a view. The function it returns, called once the view was sent, has the form render,
   * so that its commit ends the field's record of the view whatever became of it: a custom parent can keep the change
   * to itself, and the form would otherwise never learn of it. A change that reached the form had it render already,
   * and is not rendered for twice.
   */
  proposing(): () => void;
  /** Calls `send`, which sends a change that moves the items of the array at `move.fieldPath`. The form moves the
   * errors it holds for those items along when the change for that path reaches it before `send` returns, the way
   * `startTransition()` marks the updates made inside its callback. Only the form holds them all, and a field's
   * `onChange` has no way to say where an item went.
   */
  sendMove(move: AnnouncedMove, send: () => void): void;
  /** The latest data at `path`, for a field that renders the form's own data there (see `RawFormDataContext`) */
  readField<D>(path: FieldPath): D;
}
export default createContext<FormDataAccess | undefined>(undefined);
