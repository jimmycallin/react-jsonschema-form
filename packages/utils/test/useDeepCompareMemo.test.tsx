import { renderHook } from '@testing-library/react';

// oxlint-disable typescript/no-deprecated
import { ID_KEY, useDeepCompareMemo } from '../src';

interface FieldPathIdShape {
  $id: string;
  path: (string | number)[];
}

const ID_1 = 'id-1';
const ID_2 = 'id-2';
const FIELD_PATH_ID_1: FieldPathIdShape = { [ID_KEY]: ID_1, path: [ID_1] };
const FIELD_PATH_ID_1A: FieldPathIdShape = { ...FIELD_PATH_ID_1 };
const FIELD_PATH_ID_2: FieldPathIdShape = { [ID_KEY]: ID_2, path: [ID_2] };

describe('useDeepCompareMemo()', () => {
  test('initial use returns the given FieldPathIdShape', () => {
    const { result } = renderHook(() => useDeepCompareMemo<FieldPathIdShape>(FIELD_PATH_ID_1));
    expect(result.current).toBe(FIELD_PATH_ID_1);
  });
  test('second use returns the original FieldPathIdShape for same field info', () => {
    const { result, rerender } = renderHook(
      ({ newFieldPathId }) => useDeepCompareMemo<FieldPathIdShape>(newFieldPathId),
      {
        initialProps: { newFieldPathId: FIELD_PATH_ID_1 },
      },
    );
    expect(result.current).toBe(FIELD_PATH_ID_1);
    rerender({ newFieldPathId: FIELD_PATH_ID_1A });
    expect(result.current).toBe(FIELD_PATH_ID_1);
  });
  test('second use returns the new FieldPathIdShape for different field info', () => {
    const { result, rerender } = renderHook(
      ({ newFieldPathId }) => useDeepCompareMemo<FieldPathIdShape>(newFieldPathId),
      {
        initialProps: { newFieldPathId: FIELD_PATH_ID_1 },
      },
    );
    expect(result.current).toBe(FIELD_PATH_ID_1);
    rerender({ newFieldPathId: FIELD_PATH_ID_2 });
    expect(result.current).toBe(FIELD_PATH_ID_2);
  });
});
