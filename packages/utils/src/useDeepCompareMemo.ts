'use client';

import { useRef } from 'react';

import deepEquals from './deepEquals';

/** Hook that stores and returns a `T` value. If `newValue` is the same as the stored one, then the stored one is
 * returned to avoid having a component rerender due it being a different object. Otherwise, the `newValue` is stored
 * and returned.
 *
 * @deprecated - Deep comparison on every render is what React's `memo` docs warn against. Prefer passing primitive
 * values as props, whose identity is their value, so that no laundering is needed. RJSF no longer uses this hook
 * internally now that field identity is the `FieldPath` string.
 *
 * @param newValue - The potential new `T` value
 * @returns - The latest stored `T` value
 */
export default function useDeepCompareMemo<T = unknown>(newValue: T): T {
  const valueRef = useRef<T>(newValue);
  if (!deepEquals(newValue, valueRef.current)) {
    valueRef.current = newValue;
  }
  return valueRef.current;
}
