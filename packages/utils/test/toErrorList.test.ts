import { toErrorList } from '../src';
import { TEST_ERROR_LIST_OUTPUT, TEST_ERROR_SCHEMA } from './testUtils/testData';

describe('toErrorList()', () => {
  it('returns empty array when nothing is passed', () => {
    expect(toErrorList()).toEqual([]);
  });
  it('Returns an empty array when an empty object is provided', () => {
    expect(toErrorList({})).toEqual([]);
  });
  it('Returns an empty array when a child is not an object', () => {
    expect(toErrorList({ notAnObject: 'a string' })).toEqual([]);
  });
  it('Returns an empty array when a child object contributes no errors', () => {
    // @ts-expect-error testing unexpected argument handling
    expect(toErrorList({ noErrors: new Error('no enumerable keys') })).toEqual([]);
  });
  it('Returns the expected list of errors when given an ErrorSchema', () => {
    expect(toErrorList(TEST_ERROR_SCHEMA)).toEqual(TEST_ERROR_LIST_OUTPUT);
  });
});
