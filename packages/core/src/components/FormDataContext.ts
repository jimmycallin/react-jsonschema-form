import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

/** Private event access: transformed field views stay authoritative; ordinary views can read newer model edits. */
export interface FormDataAccess {
  readField(path: FieldPath, committedView: unknown, fallback?: unknown): unknown;
  readErrors(path: FieldPath, committedView: unknown, fallback: unknown): unknown;
}
export default createContext<FormDataAccess | undefined>(undefined);
