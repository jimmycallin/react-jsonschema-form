import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

/** Private event access, provided only by a self-owned `Form`, which applies each edit before the next handler runs.
 * Transformed field views stay authoritative; ordinary views can read newer model edits.
 */
export interface FormDataAccess {
  readField<D>(path: FieldPath, committedView: unknown, fallback: D): D;
  readErrors<E>(path: FieldPath, committedView: unknown, fallback: E): E;
}
export default createContext<FormDataAccess | undefined>(undefined);
