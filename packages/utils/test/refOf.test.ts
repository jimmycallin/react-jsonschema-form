import type { RJSFSchema } from '../src/index.ts';
import { RJSF_REF_SIBLING_BRANCHES_KEY, replaceEqualDeep, RJSF_REF_KEY, RJSF_REF_PATH_KEY } from '../src/index.ts';
import {
  enclosingRefPath,
  isCollapsedRecursion,
  mergeBranch,
  refPathOf,
  refSiblingBranches,
  resolvedFromRef,
  resolvedSchemaOf,
  withRefPath,
  withRefPathOf,
} from '../src/refOf.ts';

describe('resolvedSchemaOf()', () => {
  const definition: RJSFSchema = { type: 'object', allOf: [{ title: 'from the definition' }] };

  it('does not take the sibling branches of an earlier resolution for those of this reference', () => {
    const earlier = resolvedSchemaOf('#/definitions/A', {}, definition);
    expect(refSiblingBranches(earlier)).toEqual(['allOf']);

    const fromDefinition = resolvedSchemaOf('#/definitions/B', earlier, {});
    const fromSiblings = resolvedSchemaOf('#/definitions/B', {}, earlier);

    expect(RJSF_REF_SIBLING_BRANCHES_KEY in fromDefinition).toBe(false);
    expect(refSiblingBranches(fromDefinition)).toBeUndefined();
    expect(enclosingRefPath(fromDefinition, [], 'allOf')).toEqual(['#/definitions/B']);
    expect(refSiblingBranches(fromSiblings)).toEqual(['allOf']);
  });

  it('marks a second resolution of the same $ref with the same value, so it can replace the first', () => {
    const resolve = () =>
      resolvedSchemaOf('#/definitions/A', definition, { allOf: [{ title: 'beside' }], then: { title: 'beside' } });
    const first = resolve();

    expect(replaceEqualDeep(first, resolve())).toBe(first);
  });

  it('does not count a sibling keyword that is present but undefined as a branch beside the $ref', () => {
    const resolved = resolvedSchemaOf('#/definitions/A', definition, { allOf: undefined, then: { title: 'beside' } });

    expect(refSiblingBranches(resolved)).toEqual(['then']);
  });
});

describe('mergeBranch()', () => {
  const branch = resolvedSchemaOf('#/definitions/branch', { title: 'branch' }, { then: {} });

  it('keeps the reference the schema was resolved from, and none of the sibling branches of the branch', () => {
    const schema = resolvedSchemaOf('#/definitions/own', { type: 'object' }, {});

    const merged = mergeBranch(schema, branch);

    expect(merged).toEqual({ type: 'object', title: 'branch', then: {}, [RJSF_REF_KEY]: '#/definitions/own' });
  });

  it('keeps the sibling branches of the schema', () => {
    const schema = resolvedSchemaOf('#/definitions/own', { type: 'object' }, { allOf: [] });

    expect(refSiblingBranches(mergeBranch(schema, branch))).toEqual(['allOf']);
  });

  it('takes the markers of the branch for a schema that was not resolved from a reference', () => {
    const merged = mergeBranch({ type: 'object' }, branch);

    expect(resolvedFromRef(merged)).toBe('#/definitions/branch');
    expect(refSiblingBranches(merged)).toEqual(['then']);
  });
});

describe('refSiblingBranches()', () => {
  it.each([
    ['a boolean schema', true],
    ['no schema', undefined],
    ['null', null],
    ['a marker that is not a list', { [RJSF_REF_SIBLING_BRANCHES_KEY]: 'allOf' }],
  ])('returns undefined for %s', (_, schema) => {
    expect(refSiblingBranches(schema)).toBeUndefined();
  });
});

describe('withRefPath()', () => {
  const branching: RJSFSchema = { type: 'object', if: {}, then: { properties: { x: { $ref: '#/definitions/a' } } } };

  it('marks a subschema holding a keyword resolved only on its own retrieve with the path', () => {
    expect(refPathOf(withRefPath(branching, ['#/definitions/a']))).toEqual(['#/definitions/a']);
  });

  it('gives the same path the same marker, so marking again keeps the subschema', () => {
    const marked = withRefPath(branching, ['#/definitions/a']);
    expect(withRefPath(marked, ['#/definitions/a'])).toBe(marked);
    expect(refPathOf(withRefPath(branching, ['#/definitions/a']))).toBe(refPathOf(marked));
  });

  it.each<[string, unknown, string[]]>([
    ['an empty path', branching, []],
    ['a schema with no such keyword', { type: 'string' }, ['#/definitions/a']],
    ['a schema holding a $ref', { $ref: '#/definitions/a', allOf: [{}] }, ['#/definitions/a']],
    ['a boolean subschema', true, ['#/definitions/a']],
  ])('leaves %s alone', (_, schema, path) => {
    expect(withRefPath(schema, path)).toBe(schema);
  });
});

describe('refPathOf()', () => {
  it.each<[string, unknown]>([
    ['an unmarked schema', { type: 'object' }],
    ['a boolean subschema', true],
    ['null', null],
    ['a marker that is not a list', { [RJSF_REF_PATH_KEY]: '#/definitions/a' }],
  ])('reads no path off %s', (_, schema) => {
    expect(refPathOf(schema)).toBeUndefined();
  });
});

describe('withRefPathOf()', () => {
  const marked = withRefPath<RJSFSchema>({ allOf: [{}] }, ['#/definitions/a', '#/definitions/b']);

  it('adds the marked references the list lacks', () => {
    expect(withRefPathOf(marked, ['#/definitions/b', '#/definitions/c'])).toEqual([
      '#/definitions/b',
      '#/definitions/c',
      '#/definitions/a',
    ]);
  });

  it('hands back the list itself when it holds them all or the schema is unmarked', () => {
    const full = ['#/definitions/a', '#/definitions/b'];
    expect(withRefPathOf(marked, full)).toBe(full);
    expect(withRefPathOf({ allOf: [{}] }, full)).toBe(full);
  });
});

describe('isCollapsedRecursion()', () => {
  it('is true for a branch still holding a $ref on its path', () => {
    expect(isCollapsedRecursion({ $ref: '#/definitions/a' }, ['#/definitions/a'])).toBe(true);
  });

  it('is false for a $ref off the path or a branch holding none', () => {
    expect(isCollapsedRecursion({ $ref: '#/definitions/b' }, ['#/definitions/a'])).toBe(false);
    expect(isCollapsedRecursion({ type: 'object' }, ['#/definitions/a'])).toBe(false);
  });
});
