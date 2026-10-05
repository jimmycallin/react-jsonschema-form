import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

/** Private event access: transformed field views stay authoritative; ordinary views can read newer model edits. */
export interface FormDataAccess {
  /** Whether an edit is applied before the next event handler runs: true when `Form` owns the data */
  chainsEdits(): boolean;
  readField<D>(path: FieldPath, committedView: unknown, fallback: D): D;
  readErrors<E>(path: FieldPath, committedView: unknown, fallback: E): E;
}
export default createContext<FormDataAccess | undefined>(undefined);
