import { createContext } from 'react';
import type { FieldPath } from '@rjsf/utils';

/** Private event access for container fields. Transformed field views stay authoritative; ordinary views read the
 * form's latest edit, which in a parent-owned form is a proposal made earlier in the same tick.
 */
export interface FormDataAccess {
  /** Changes whenever such a proposal is dropped (React rendered, or the tick ended), and with it a field's record of it */
  epoch(): number;
  readField<D>(path: FieldPath, committedView: unknown, fallback: D): D;
  readErrors<E>(path: FieldPath, committedView: unknown, fallback: E): E;
}
export default createContext<FormDataAccess | undefined>(undefined);
