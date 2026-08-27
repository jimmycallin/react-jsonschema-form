import {
  DEFAULT_ID_PREFIX,
  DEFAULT_ID_SEPARATOR,
  ROOT_FIELD_PATH,
  fieldPathToId,
  fieldPathToList,
  fieldPathToName,
  toFieldPath,
} from '../src';

const GLOBAL_FORM_OPTIONS = {
  idPrefix: DEFAULT_ID_PREFIX,
  idSeparator: DEFAULT_ID_SEPARATOR,
};

describe('toFieldPath()', () => {
  test('no parent, string segment', () => {
    expect(toFieldPath('one')).toEqual('one');
  });
  test('no parent, number segment', () => {
    expect(toFieldPath(1)).toEqual('[1]');
  });
  test('an empty segment names no field, so the parent is returned unchanged', () => {
    expect(toFieldPath('')).toEqual(ROOT_FIELD_PATH);
    expect(toFieldPath('', 'one')).toEqual('one');
  });
  test('appends a property name to a parent', () => {
    expect(toFieldPath('two', toFieldPath('one'))).toEqual('one.two');
  });
  test('appends an array index to a parent', () => {
    expect(toFieldPath(1, toFieldPath('one'))).toEqual('one[1]');
  });
  test('escapes reserved characters in a property name', () => {
    expect(toFieldPath('a.b', 'one')).toEqual('one.a\\.b');
    expect(toFieldPath('a[0]', 'one')).toEqual('one.a\\[0\\]');
    expect(toFieldPath('a\\b', 'one')).toEqual('one.a\\\\b');
  });
});

describe('fieldPathToList()', () => {
  test('the root path has no segments', () => {
    expect(fieldPathToList(ROOT_FIELD_PATH)).toEqual([]);
  });
  test('array indexes come back as numbers, property names as strings', () => {
    expect(fieldPathToList('tasks[0].title')).toEqual(['tasks', 0, 'title']);
  });
  test('a numeric property name stays a string', () => {
    expect(fieldPathToList(toFieldPath('0', 'a'))).toEqual(['a', '0']);
  });
  test('round-trips property names containing reserved characters', () => {
    const tricky = ['a.b', 'c[0]', 'd\\e', '[1]'];
    const path = tricky.reduce((acc, segment) => toFieldPath(segment, acc), ROOT_FIELD_PATH);
    expect(fieldPathToList(path)).toEqual(tricky);
  });
  test('a trailing escape character is dropped rather than producing a stray segment', () => {
    expect(fieldPathToList('a\\')).toEqual(['a']);
  });
  test('handles adjacent array indexes', () => {
    const path = toFieldPath(1, toFieldPath(0, 'matrix'));
    expect(path).toEqual('matrix[0][1]');
    expect(fieldPathToList(path)).toEqual(['matrix', 0, 1]);
  });
});

describe('fieldPathToId()', () => {
  test('the root path is the idPrefix', () => {
    expect(fieldPathToId(ROOT_FIELD_PATH, GLOBAL_FORM_OPTIONS)).toEqual(DEFAULT_ID_PREFIX);
  });
  test('joins the segments with the idSeparator', () => {
    expect(fieldPathToId('tasks[0].title', GLOBAL_FORM_OPTIONS)).toEqual(
      `${DEFAULT_ID_PREFIX}${DEFAULT_ID_SEPARATOR}tasks${DEFAULT_ID_SEPARATOR}0${DEFAULT_ID_SEPARATOR}title`,
    );
  });
  test('is a plain string, so equal paths produce equal ids', () => {
    expect(fieldPathToId('a.b', GLOBAL_FORM_OPTIONS)).toBe(fieldPathToId(toFieldPath('b', 'a'), GLOBAL_FORM_OPTIONS));
  });
});

describe('fieldPathToName()', () => {
  const phpNameGenerator = (path: (string | number)[], idPrefix: string, isMultiValue?: boolean) => {
    if (path.length === 0) {
      return idPrefix;
    }
    const name = `${idPrefix}${path.map((segment) => `[${segment}]`).join('')}`;
    return isMultiValue ? `${name}[]` : name;
  };
  const OPTIONS_WITH_NAME_GENERATOR = { ...GLOBAL_FORM_OPTIONS, nameGenerator: phpNameGenerator };

  test('undefined when no nameGenerator is configured', () => {
    expect(fieldPathToName('firstName', GLOBAL_FORM_OPTIONS)).toBeUndefined();
  });
  test('undefined for the root path', () => {
    expect(fieldPathToName(ROOT_FIELD_PATH, OPTIONS_WITH_NAME_GENERATOR)).toBeUndefined();
  });
  test('generates a name for a nested path', () => {
    expect(fieldPathToName('tasks[0].title', OPTIONS_WITH_NAME_GENERATOR)).toEqual('root[tasks][0][title]');
  });
  test('the isMultiValue flag is passed through', () => {
    expect(fieldPathToName('hobbies', OPTIONS_WITH_NAME_GENERATOR, true)).toEqual('root[hobbies][]');
    expect(fieldPathToName('hobbies', OPTIONS_WITH_NAME_GENERATOR, false)).toEqual('root[hobbies]');
  });
});
