import type { EnumOptionsType } from '../src';
import { enumOptionsIsSelected } from '../src';

// `value` is typed as a JSON schema value, which excludes `undefined`, but widgets do call this with an unset value,
// which the implementation handles; the cast keeps that case covered
const UNSET = undefined as unknown as EnumOptionsType['value'];

const VALUE = { foo: 'bar' };
const VALUES = [VALUE, 'another'];
describe('enumOptionsIsSelected()', () => {
  it('returns false when two values do not match', () => {
    expect(enumOptionsIsSelected(UNSET, null)).toBe(false);
  });
  it('returns true when two values match', () => {
    expect(enumOptionsIsSelected(VALUE, { foo: 'bar' })).toBe(true);
  });
  it('returns false when value is not in array of selected values', () => {
    expect(enumOptionsIsSelected('foo', VALUES)).toBe(false);
  });
  it('returns true when value is in array of selected values', () => {
    expect(enumOptionsIsSelected({ foo: 'bar' }, VALUES)).toBe(true);
  });
});
