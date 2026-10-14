import {
  ADDITIONAL_PROPERTIES_KEY,
  ALL_OF_KEY,
  ANY_OF_KEY,
  DEPENDENCIES_KEY,
  ELSE_KEY,
  IF_KEY,
  ONE_OF_KEY,
  PATTERN_PROPERTIES_KEY,
  REF_KEY,
  RJSF_REF_SIBLING_BRANCHES_KEY,
  RJSF_REF_KEY,
  RJSF_REF_PATH_KEY,
  THEN_KEY,
} from './constants.ts';
import mergeSchemas from './mergeSchemas.ts';
import type { GenericObjectType, RJSFMarkedSchema, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Returns the `$ref` the given `schema` still holds, which is one that has yet to be resolved.
 *
 * @param schema - The schema to read the reference off, if there is one to read it off at all
 * @returns - The `$ref` the schema holds, or undefined when it holds none
 */
export function declaredRef<S extends StrictRJSFSchema = RJSFSchema>(schema: S | undefined): string | undefined {
  return schema?.[REF_KEY];
}

/** Returns the `$ref` that the given `schema` was resolved from, which `resolveAllReferences()` marks it with. A
 * resolved schema no longer holds the reference as a key, so the marker is what names where it came from.
 *
 * @param schema - The schema to read the marker off, if there is one to read it off at all
 * @returns - The `$ref` the schema was resolved from, or undefined when it was not resolved from one
 */
export function resolvedFromRef<S extends StrictRJSFSchema = RJSFSchema>(schema: S | undefined): string | undefined {
  return (schema as RJSFMarkedSchema | undefined)?.[RJSF_REF_KEY] as string | undefined;
}

/** The keywords whose subschemas are resolved as branches, each on a resolution path of its own, which makes them the
 * ones `enclosingRefPath()` is asked about.
 */
const BRANCH_KEYWORDS: string[] = [ALL_OF_KEY, DEPENDENCIES_KEY, ELSE_KEY, THEN_KEY];

/** One frozen list per combination of branch keywords, so that resolving the same `$ref` again marks it with the same
 * value and `replaceEqualDeep()` can keep the earlier resolution.
 */
const siblingBranchLists = new Map<string, readonly string[]>();

function siblingBranchList(siblings: object): readonly string[] | undefined {
  const branches = BRANCH_KEYWORDS.filter((keyword) => Reflect.get(siblings, keyword) !== undefined);
  if (branches.length === 0) {
    return undefined;
  }
  const key = branches.join();
  let list = siblingBranchLists.get(key);
  if (list === undefined) {
    list = Object.freeze(branches);
    siblingBranchLists.set(key, list);
  }
  return list;
}

/** Returns the schema a `$ref` resolves to: the definition it names under the keywords that stood beside it, marked
 * with the reference it was resolved from and with which of its branch keywords were ones beside the `$ref`.
 *
 * @param ref - The `$ref` being resolved
 * @param definition - The schema definition the `$ref` names
 * @param siblings - The keywords that stood beside the `$ref`, which override the definition's
 * @returns - The resolved schema, marked with where it came from
 */
export function resolvedSchemaOf<S extends StrictRJSFSchema = RJSFSchema>(
  ref: string | undefined,
  definition: S,
  siblings: object,
): S {
  const resolved = { ...definition, ...siblings, [RJSF_REF_KEY]: ref };
  // A list the definition or the siblings carry from an earlier resolution is not this reference's
  setOrDelete(resolved, RJSF_REF_SIBLING_BRANCHES_KEY, siblingBranchList(siblings));
  return resolved;
}

function setOrDelete(target: object, marker: symbol, value: unknown) {
  if (value === undefined) {
    Reflect.deleteProperty(target, marker);
  } else {
    Reflect.set(target, marker, value);
  }
}

/** Merges a resolved `branch` of a `schema` into it, keeping the markers that say where `schema` itself was resolved
 * from. `mergeSchemas()` copies the branch's markers over them, and a branch that was a `$ref` would leave the merged
 * schema named after the branch's definition: the next branch would then be resolved on that definition's path
 * rather than on the schema's own. A schema that was not resolved from a reference takes the branch's markers, since
 * a branch that is the `$ref` back to an enclosing definition is how such a schema is known to be inside it.
 *
 * @param schema - The schema the branch belongs to
 * @param branch - The resolved branch to merge into it
 * @returns - The merged schema, marked as `schema` is when it is marked at all
 */
export function mergeBranch<S extends StrictRJSFSchema = RJSFSchema>(schema: S, branch: GenericObjectType): S {
  const merged = mergeSchemas(schema, branch) as S;
  const ownRef = resolvedFromRef<S>(schema);
  if (ownRef !== undefined) {
    Reflect.set(merged, RJSF_REF_KEY, ownRef);
    setOrDelete(merged, RJSF_REF_SIBLING_BRANCHES_KEY, refSiblingBranches(schema));
  }
  return merged;
}

/** Returns the branch keywords that stood beside the `$ref` the given `schema` was resolved from, which
 * `resolvedSchemaOf()` marks it with.
 *
 * @param schema - The schema to read the marker off, if it is one that can carry it at all
 * @returns - The branch keywords from beside the `$ref`, or undefined when there were none
 */
export function refSiblingBranches(schema: unknown): unknown[] | undefined {
  if (typeof schema !== 'object' || schema === null || !(RJSF_REF_SIBLING_BRANCHES_KEY in schema)) {
    return undefined;
  }
  const siblingBranches = schema[RJSF_REF_SIBLING_BRANCHES_KEY];
  return Array.isArray(siblingBranches) ? siblingBranches : undefined;
}

/** Returns the resolution path for what a `schema` holds, which is the path `schema` was reached by plus the reference
 * it was itself resolved from. A `$ref` back to that reference from inside the definition is a recursion, and having it
 * on the path is what leaves such a `$ref` collapsed rather than expanded once more on every resolution.
 *
 * A branch `keyword` that stood beside the `$ref` is not part of the definition, so the reference stays off the path of
 * what it holds: a `$ref` to the same definition in there is a second use of it, not a way back into it.
 *
 * @param schema - The schema whose own reference joins the path
 * @param recurseList - The list of refs already expanded on the current resolution path
 * @param [keyword] - The branch keyword of `schema` the path is for, when it is for the subschemas of one
 * @returns - `recurseList` plus the reference `schema` was resolved from, when it carries one that is not on the list
 *          already and that the `keyword` did not stand beside
 */
export function enclosingRefPath<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  recurseList: string[],
  keyword?: string,
): string[] {
  const sourceRef = resolvedFromRef<S>(schema);
  if (sourceRef === undefined || recurseList.includes(sourceRef)) {
    return recurseList;
  }
  return refSiblingBranches(schema)?.includes(keyword) ? recurseList : [...recurseList, sourceRef];
}

/** The keywords whose subschemas `resolveAllReferences()` leaves alone, to be resolved when the schema holding them is
 * retrieved on its own.
 */
const DEFERRED_KEYWORDS: string[] = [
  ADDITIONAL_PROPERTIES_KEY,
  ALL_OF_KEY,
  ANY_OF_KEY,
  DEPENDENCIES_KEY,
  IF_KEY,
  ONE_OF_KEY,
  PATTERN_PROPERTIES_KEY,
];

/** One frozen list per path, so that marking the same subschema on the same path again gives it the same value and
 * `replaceEqualDeep()` can keep the earlier resolution.
 */
const refPaths = new Map<string, readonly string[]>();

function internedPath(path: readonly string[]): readonly string[] {
  // A `$ref` can hold any character, so the entries are joined with one no JSON pointer or URI carries unescaped
  const key = path.join('\n');
  let interned = refPaths.get(key);
  if (interned === undefined) {
    interned = Object.freeze([...path]);
    refPaths.set(key, interned);
  }
  return interned;
}

/** Returns the references `resolveAllReferences()` expanded on the way to the given subschema, as `withRefPath()`
 * marked it with.
 *
 * @param schema - The schema to read the marker off, if it is one that can carry it at all
 * @returns - The references expanded on the way to the subschema, or undefined when it was not marked
 */
export function refPathOf(schema: unknown): readonly string[] | undefined {
  if (typeof schema !== 'object' || schema === null || !(RJSF_REF_PATH_KEY in schema)) {
    return undefined;
  }
  const path = schema[RJSF_REF_PATH_KEY];
  return Array.isArray(path) ? path : undefined;
}

/** Returns `recurseList` with the references the `schema` was marked as reached through added, so that a retrieve of a
 * subschema starts on the path the walk that left it unresolved was on.
 *
 * @param schema - The schema about to be resolved
 * @param recurseList - The list of refs already expanded on the current resolution path
 * @returns - `recurseList`, with any of the marked references it lacks added
 */
export function withRefPathOf(schema: unknown, recurseList: string[]): string[] {
  const path = refPathOf(schema);
  if (path === undefined) {
    return recurseList;
  }
  const missing = path.filter((ref) => !recurseList.includes(ref));
  return missing.length === 0 ? recurseList : [...recurseList, ...missing];
}

/** Returns the `schema` marked with the `path` of references expanded on the way to it, when it holds keywords that are
 * resolved only once it is retrieved on its own, which is when the path would otherwise be lost. A schema holding a
 * `$ref` is left alone, since resolving the reference is what decides whether it is a recursion.
 *
 * @param schema - A subschema `resolveAllReferences()` walked past without resolving all of it
 * @param path - The references expanded on the way to it
 * @returns - The schema, marked with the path when it needs it, or the schema itself when it is already marked so
 */
export function withRefPath<S>(schema: S, path: string[]): S {
  if (
    path.length === 0 ||
    typeof schema !== 'object' ||
    schema === null ||
    REF_KEY in schema ||
    !DEFERRED_KEYWORDS.some((keyword) => keyword in schema)
  ) {
    return schema;
  }
  const interned = internedPath(path);
  return refPathOf(schema) === interned ? schema : { ...schema, [RJSF_REF_PATH_KEY]: interned };
}

/** Returns whether a branch came back from its resolution still holding a `$ref` already expanded on the path it was
 * resolved on, which is a recursion its resolution left collapsed. Merged into the schema the branch belongs to, it
 * makes that schema the recursion, the way a property holding the same `$ref` is.
 *
 * @param branch - The branch as its resolution returned it
 * @param path - The path the branch was resolved on
 * @returns - Whether the branch is a recursion left collapsed
 */
export function isCollapsedRecursion<S extends StrictRJSFSchema = RJSFSchema>(branch: S, path: string[]): boolean {
  const ref = declaredRef<S>(branch);
  return ref !== undefined && path.includes(ref);
}
