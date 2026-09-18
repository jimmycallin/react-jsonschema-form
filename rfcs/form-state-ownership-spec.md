# Form data ownership: specification and implementation plan

Status: proposed implementation contract for a breaking release. PR 1a is open as [rjsf-team#5289](https://github.com/rjsf-team/react-jsonschema-form/pull/5289) (`getFormData()`, `FormHandle`, docs); everything after it is unimplemented.

Review revision: 2026-09-15. This document supersedes earlier drafts. [The research review](form-state-api-research.md) supplies evidence and rationale. Ownership is inferred from `formData`, with no explicit mode prop. Controlled forms never generate or propose defaults; the parent seeds them with the exported schema utility. Lossless queued changes are part of this milestone. Controlled reset leaves data to the parent, with no data proposal. A controlled value mirror is not part of the design.

**Migration headline: rename `formData` to `initialFormData` for an editable seeded form unless an `onChange` handler accepts updates into the supplied value.** A logging-only handler is not acceptance. Intentionally fixed/read-only controlled forms keep `formData`. Put this guidance first in release notes and the migration guide.

## 1. First milestone: establish ownership while keeping the class

Give form data exactly one owner. Controlled forms render the parent's value; uncontrolled forms own their value. Remove the machinery that reconciles two competing current values.

Keep `Form<T, S, F>` a class. Preserve existing schema-editing behavior and public notifications wherever they do not conflict with ownership. Do not combine this with a hooks conversion, a new default-generation algorithm, or a redesigned event/reset API.

### Required invariants

1. Controlled render, submit, and current-value validation read current `formData` props. No persistent optimistic value or state mirror may override them.
2. Uncontrolled render, submit, and current-value validation read committed internal state. Unrelated prop changes never restore the initial seed.
3. Both modes use one shared change pipeline; only committing data differs.
4. No parent update, mount, or schema change causes a controlled `onChange`. Controlled defaults are the parent's; the form neither installs nor proposes them.
5. Existing field/default/validation regressions remain covered. Do not weaken unrelated behavior to make ownership tests pass.
6. Caller-owned data, schemas, and errors are never mutated.
7. Retain lossless serialization of accepted controlled path changes. No new synchronous form store, optimistic value mirror, or read-before-commit guarantee is introduced.

### Scope boundary

| Implement now                                                         | Defer to separately specified work                                                  |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Strict inferred value ownership, frozen at mount                      | Function-component conversion                                                       |
| Shared transition path and removal of controlled value reconciliation | Conditional-default and sanitization policy redesign                                |
| Necessary nested-field fixes for rejected controlled updates          | General array/field rewrite                                                         |
| `getFormData()` and a typed `FormHandle`                              | `setFormData()`, `clearErrors()`, batch APIs                                        |
| Controlled reset clears local errors only                             | New reset arguments, captured baseline API, native reset integration                |
| Existing validation notifications without value echo loops            | `onValidationChange` and a data-only `onChange` contract                            |
| Existing uncontrolled initialization and schema-change semantics      | Making initial props immutable reset baselines                                      |
| Ownership tests, consumer migration, release documentation            | Dirty/touched subscriptions, async initialization options, validation-mode redesign |

Do not implement deferred work merely because the research review describes a useful precedent.

## 2. Files to inspect

| File                                                           | What to inspect                                                                                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/core/src/components/Form.tsx`                        | Constructor notification; snapshot/update lifecycle; `getStateFromProps`; pending changes; reset/blur/submit; validation; rendering. |
| `packages/core/src/components/fields/ArrayField.tsx`           | `useKeyedFormData` and optimistic item values.                                                                                       |
| `packages/core/src/components/fields/MultiSchemaField.tsx`     | Branch selection, sanitization, defaults, skip flags.                                                                                |
| `packages/core/src/components/fields/ObjectField.tsx`          | Atomic additional-property operations and path propagation.                                                                          |
| `packages/core/src/components/templates/BaseInputTemplate.tsx` | Widget display normalization; keep DOM inputs controlled internally.                                                                 |
| `packages/core/test/Form.behaviors.test.tsx`                   | Reset, dependency defaults, async errors, `initialFormData feature to prevent form reset`.                                           |
| `packages/core/test/Form.handlers.test.tsx`                    | Controlled change/clearing regressions.                                                                                              |
| `packages/core/test/Form.errors.test.tsx`                      | Error clearing dependent on prop echoes.                                                                                             |
| `packages/core/test/testUtils.tsx`                             | A spy handler does not constitute an accepting controlled parent.                                                                    |
| `packages/utils/src/schema/getDefaultFormState.ts`             | Reuse its existing behavior; do not rewrite globally.                                                                                |
| `packages/core/src/withTheme.tsx` and theme wrappers           | Mode, optional data, and ref forwarding.                                                                                             |
| `packages/core/src/components/FormHandle.ts`                   | The exported handle contract from PR 1a; `Form` implements it. Extend it here, never through the class alone.                        |

The existing reset regression allows editing fixed `formData` without parent acceptance, then restores it after `disabled` changes. Those two tests passed during initial analysis. The controlled expectation is intentionally changed by this milestone; the uncontrolled expectation remains.

Inventory public refs and `.state` reads across the repository before editing types. Root `docs/README.md` marks that directory deprecated; these design records live in `rfcs/`. Published API/migration documentation belongs in `packages/docs`.

Budget for deliberate fixture migration in the form behavior, error, handler, and state tests. Classify editable seeded fixtures, accepting controlled fixtures, and intentionally fixed fixtures; do not mass-rename `formData` occurrences.

## 3. Public contract for this milestone

### 3.1 Mode selection

Retain `formData`, `initialFormData`, and `onChange`. Add no ownership prop. Ownership is inferred from whether the caller supplies a value, exactly as React infers it for `<input>`:

```ts
const controlled = props.formData !== undefined;
```

Select once at construction and keep that owner for the instance. `Form.tsx` already computes ownership this way, so this rule is existing behavior made strict rather than a new concept.

Null is a JSON value, not a request to fall back to initial data. Once controlled, a later undefined value remains controlled: an absent root is a legitimate model for an optional object, and the user clearing every field must not hand ownership to the form.

| Initial props                                              | Result                                                   |
| ---------------------------------------------------------- | -------------------------------------------------------- |
| Defined `formData`, including null/false/zero/empty string | Controlled.                                              |
| Omitted or undefined `formData`                            | Uncontrolled. Optional-prop forwarding behaves normally. |
| Only `initialFormData`, or neither data prop               | Uncontrolled, initialized using existing defaults.       |
| Defined `formData` plus defined `initialFormData`          | Development warning; ignore initial data.                |

Compare against `undefined` only. Do not use own-property detection (`'formData' in props`): a wrapper that spreads its props forwards `formData: undefined` as an own property, and would silently become controlled.

No ownership prop is offered for a controlled root that starts undefined. Section 8 gives the two supported patterns for asynchronously loaded data. Adding an explicit mode later would be additive and non-breaking, so it stays out until a case appears that those patterns cannot serve.

#### Development diagnostics

Three checks, each a single `console.warn` at the point of detection. No warning registry or per-kind deduplication framework. Keep them out of production.

1. **Uncontrolled form receiving defined `formData` after mount.** Keep the original owner; never throw or transfer ownership. This is the one diagnostic that carries real weight, because it is the only signal for the asynchronous-data trap in section 8, and the failure is otherwise silent: the loaded record is ignored and the form keeps showing its own data. The message must name both fixes, not merely report the attempt.
2. **Conflicting data props**, meaning defined `formData` together with defined `initialFormData`. Ignore the initial data.
3. **Controlled mount with no `onChange`** and neither `readonly` nor `disabled`. This mirrors React's own missing-handler warning and catches the headline migration break where it happens. It cannot detect a handler that ignores the event; do not try. Recommend `initialFormData` for seeded editing, or an accepting `onChange` for controlled editing.

The reverse transition, a controlled form whose `formData` becomes undefined, does not warn. React treats `value={undefined}` as the absence of control, but an RJSF root model can legitimately be absent, and that direction does not silently discard caller data.

A fixed controlled value with no handler stays fixed; the warning does not select ownership. Document `readonly` for intentional fixed presentation. Changing a React `key` starts a new instance, which is the supported way to switch records.

Keep the existing large `FormProps` interface and generic inference. Do not add data-prop aliases or a complex union solely to enforce these combinations.

### 3.2 Controlled values

Render the exact current prop model. Missing values may have an empty widget representation, but this is not stored or submitted as new model data. An idle edit queue emits its first proposal synchronously; subsequent queued operations wait for a commit opportunity and use the latest props. Only the parent can accept a proposal.

Rejected proposals leave displayed values unchanged. Transformed/replaced parent values win immediately, without an old-data commit followed by lifecycle repair. Data-only parent updates do not emit data proposals.

A controlled form never generates whole-form defaults. Not on mount, not when the schema or default configuration changes, not when the parent replaces data. Controlled means the parent owns the value, and the value includes its defaults. The parent seeds them with the exported utility, section 8 shows how, and the first render then shows exactly what the parent passed, which also makes first-render and server output correct without a post-mount round trip.

No surveyed library emits a data-changing callback on mount, and React's own `<input value>` never calls `onChange` unprompted. A mount-time proposal accepted by `setData(event.formData)` is a state sync laundered through a child callback, the pattern React documents against, and it drags along an entire loop-prevention mechanism (single-attempt marking, semantic schema comparison, superseded-context skipping, StrictMode guards) whose only job is to police the proposal. Removing the proposal removes the mechanism and the class of bug.

Edit-time defaults and sanitization inside a user operation are unchanged: a branch switch or a new array item still carries its defaults in that operation's proposal, exactly as today. This section removes lifecycle-originated defaults only.

### 3.3 Uncontrolled values

Initialize from `initialFormData` plus existing schema-default behavior. Edits compose in internal state and notify through the existing callback shape. Later initial-data prop changes do not replace current data.

Preserve the existing documented reset use of the latest `initialFormData` and current schema. Do not introduce a captured reset baseline in this milestone.

An unrelated prop update must not rerun value initialization. For schema/default-configuration changes that currently transform uncontrolled data, preserve the characterized behavior using the current internal value as input, never the initial seed. Put this in a specifically guarded uncontrolled transition, separate from render-context derivation. Controlled schema/default-configuration changes derive render context only; they never rewrite the parent model internally and emit nothing.

### 3.4 Existing notifications, with a narrow compatibility boundary

Retain `onChange(event, id?)`, `onSubmit`, `onError`, `onBlur`, and `onFocus` signatures and existing event fields. Do not add `onValidationChange` yet.

| Cause                                                 | Milestone notification rule                                                                                                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User edit or `setFieldValue`                          | One proposal per operation in controlled mode; one committed result per operation in uncontrolled mode.                                                       |
| Parent accepts/transforms/replaces controlled data    | No data-echo `onChange`.                                                                                                                                      |
| Controlled mount                                      | No notification. Defaults are seeded by the parent; see section 8.                                                                                            |
| Controlled schema/default-context change              | No notification. Render context re-derives; data is untouched.                                                                                                |
| Uncontrolled mount adds defaults to the supplied seed | Preserve the existing notification condition and payload, but deliver after mount rather than from the constructor.                                           |
| Blur validation/omission                              | Preserve existing change-notification conditions, including error-only changes. Controlled omission is a proposal; validation-only events carry current data. |
| Explicit reset                                        | Uncontrolled reset keeps its existing notification. Controlled reset emits no `onChange`.                                                                     |
| Uncontrolled schema/default transition changes data   | Preserve the characterized notification; no notification when only render context changes.                                                                    |

The retained `onChange` is not yet a data-only event. Document that it can report validation-only changes. When a parent echoes the same value from such an event, do not create a second notification. Uncontrolled default generation that leaves the seed unchanged emits no mount notification.

Use post-commit lifecycle methods for notifications where necessary. No callback inside render, constructors, or functional state updaters. StrictMode must not duplicate a single logical operation's callback; guard post-mount compatibility notifications appropriately.

### 3.5 Reset, blur, submit, and imperative reads

Preserve `reset()` without arguments, with ownership determining whether data can be reset:

- Uncontrolled reset computes defaults using the latest initial seed and current schema, clears local errors using existing behavior, commits, and emits its existing reset notification.
- Controlled reset clears local validation and field-error state only. It leaves the supplied model unchanged and emits no `onChange`, including no errors-only reset notification. Do not compute schema defaults, re-default the current value, or choose a replacement model.
- The parent chooses whether data should return to a saved record, become empty, or receive schema defaults. It does so by replacing `formData` explicitly. If it also needs local state cleared, use `reset()`; it cannot echo old data back into the parent's update. Remounting via `key` remains available for a complete instance reset.
- Do not retain a controlled baseline or add reset arguments, `clearErrors()`, or an acceptance protocol. Preserve ordering with queued operations, but the reset operation produces no controlled data proposal.
- Reset itself must not immediately live-validate the unchanged controlled data and recreate the errors it clears. A later normal validation trigger can validate again. Preserve external error ownership; this operation does not delete parent-supplied errors.

This supersedes the earlier fresh-schema-defaults reset proposal. That proposal was compatible with strict ownership, but could erase a loaded record when accepted and was not needed to fix competing value owners. Suppressing the old controlled reset `onChange` is a deliberate, documented callback break; do not present it as behavior-preserving.

Preserve configured live validation and omission. On blur, read authoritative data, compute any omit proposal, and apply existing validation/notification rules. In controlled mode no proposed omission is installed internally.

On submit, read authoritative data, compute the existing omitted submission copy when configured, validate, and use that exact copy in `onSubmit`. Preserve current uncontrolled success-time storage of the omitted value. Controlled submission cannot silently install that value internally and does not introduce a new `onChange` notification. Keep existing failed-submit and focus behavior.

`validateForm()` reads authoritative current data; `validateFormWithFormData(data)` validates its explicit input and does not install it as current data. Preserve existing return types and notification rules. Validate a separate JSON-compatible copy; preserve falsey roots, remove undefined object keys for validation, and handle root undefined without JSON parsing errors.

Add `getFormData(): T | undefined` as the supported alternative to reading instance state. It returns current props in controlled mode and committed state in uncontrolled mode. It is read-only by contract. Do not return queued/unaccepted proposals.

Its purpose is uncontrolled mode, where the form owns the value and `onChange` is push-only: autosave, route guards, and a submit button outside the form otherwise force the parent to mirror every keystroke. Mantine added `form.getValues()` for the same reason when it introduced uncontrolled mode. In controlled mode the getter returns the value the parent already holds; it exists there for handle symmetry, not as a feature.

Set-then-immediate-read or set-then-immediate-submit before React commits has no new guarantee. For controlled forms, it cannot use a proposal the parent has not accepted. Tests and docs should wait for committed updates. Do not add `flushSync`, a synchronous shadow store, or queues replayed by getters to create a stronger API.

Every store-owning library's getter is read-your-writes, so a developer arriving from React Hook Form or Mantine will assume `setFieldValue()` then `getFormData()` reflects the change. It does not, and the failure is a silently stale value. The method's TSDoc must state that it returns committed data and that an imperative write in the same tick is not yet visible; that caveat cannot live only in this document.

### 3.6 Imperative handle and event types

Export `FormHandle<T, S, F>` containing `getFormData` and the supported existing methods: `submit`, `reset`, `setFieldValue`, `validateForm`, `validateFormWithFormData`, `validate`, and `focusOnError`. Reuse current signatures. The class structurally implements this handle.

The ref prop stays `Ref<Form<T, S, F>>` while `Form` is a class. PR 1a tried `Ref<FormHandle<T, S, F>>` and it does not typecheck: TSX types a class element's `ref` by its instance (`IntrinsicClassAttributes<Form>`), so an object ref typed as the handle is rejected on `<Form ref>`, and `withTheme`'s forward fails the same way. No cast is acceptable. The supported pattern, documented in the upgrade guide, is a class-typed ref narrowed to `FormHandle` at the use site; it needs no change when the prop type does. Changing the prop to `Ref<FormHandle>` is a deliverable of the function-component conversion in section 9, not of this milestone. Keep the class export; remove lifecycle/state members only from the handle, not by deleting unrelated class methods.

A `ref` carrying a narrow handle is the correct shape for this component, not a compromise. Most surveyed libraries expose their methods on a hook-created form instance instead, but in every one of them that instance is the store, and the component is a renderer bound to it. RJSF's controlled mode has no store: the parent's state is the store and there is nothing for an instance to hold. For a component that does not own a store, a `ref` plus the handle `useImperativeHandle` would produce is the React idiom, and React 19's `ref`-as-prop, which `withTheme` already uses, removes the old `forwardRef` friction. The current ref exposes the whole class, `state` and lifecycle included; narrowing that is only free while the release is already breaking.

`validate` and `validateFormWithFormData` are stateless and do not belong on a handle in principle. They stay for compatibility; trimming them is noted in section 9.

Decouple `IChangeEvent` from `Pick<FormState, ...>` so internal state can change without forcing an event redesign. Preserve its fields and submitted status. Retain characterized `edit` semantics where possible; it is not a new ownership flag. Any unavoidable difference must have a concrete test and migration note, not an unrelated redefinition.

Do not keep controlled `state.formData` for public compatibility. State-layout changes are an explicitly documented break; events and `getFormData()` are the supported data access paths. Other cached state may remain temporarily if removing it would require a separate validation/configuration redesign.

## 4. Shared implementation design

Create one authoritative accessor, one shared transition pipeline, and one ownership decision:

```ts
// Structural sketch, not copy-paste implementation.
const next = applyChange(current, change, context);
if (controlled) {
  notify(next);
} else {
  commitAndNotify(next);
}
```

`applyChange` includes existing path updates, default/sanitization behavior, configured omission, and validation/error processing, extracted into explicit steps as needed. It must not read `this.props`/`this.state` implicitly or perform callbacks. Pass needed current context, including existing default-generation flags and errors, explicitly. Preserve utility behavior rather than writing a new schema-transition engine.

The result must share references with `current` wherever a subtree is unchanged: `applyChange` ends with `replaceEqualDeep(current, next)` from `@rjsf/utils`, the pass `processPendingChange` runs today against the current state at its `setState`. In controlled mode the proposal is what an accepting parent hands back as the next prop, so this is what keeps the props of sibling fields reference-equal across a keystroke. `renderStability.test.tsx` pins it with an accepting parent.

Uncontrolled operations must read the latest prior internal transition, using pure functional updates or the existing serial queue. Capture each operation's result for its callback; do not construct an old operation's event from later state. A queue for composing writes does not imply read-your-pending-writes semantics.

### Controlled queue: retain composition without a value mirror

Keep an ordered queue of operations, not precomputed whole-form snapshots or an optimistic current model. When idle, process the first operation against current props and emit its proposal. Before processing the next, allow React to commit the parent's synchronous response. Then read current props again and process the next operation.

A small internal state checkpoint and its `setState` callback can supply this scheduling boundary using the existing serial-queue structure. Its state contains only scheduling metadata, not form data. Set the busy guard before calling consumer code so reentrant changes enqueue rather than execute against stale props. Schedule the checkpoint after the proposal callback. Do not wait for data equality or acceptance: a rejected proposal still advances the queue after the checkpoint. `Form` and `SchemaField` compare props shallowly (rjsf-team#5217, part 2), so the checkpoint state must be a new object each time it advances, or the update that runs the callback is skipped.

Example: starting from `{ a: '', b: '' }`, queue `a='first'` and `b='second'` within one `act`. An accepting parent commits the first before the second is processed, so the final model contains both. If the parent transforms `a` to `'FIRST'`, the second proposal preserves that. If it rejects the first, the second proposal must preserve the old `a`; never resurrect a rejected value.

This relies on the normal controlled-input contract: the parent accepts with a prompt ordinary state update. A delayed or transition-priority parent update is not a committed value to compose against. Never merge a late parent response into current data yourself. Do not add timers, `flushSync`, an unbounded draft, or a public batching API.

Only user operations, `setFieldValue`, and reset enter the queue; no lifecycle method enqueues anything. Reset and reentrant edits preserve request order; an errors-only controlled reset advances the queue without notifying `onChange`. On unmount discard pending work. Handle callback failures without a permanently busy queue, following existing error propagation conventions.

For deliberate atomic full replacement, retain `setFieldValue([], nextObject)` or a parent update. A replacement is still a replacement; do not infer patches from two caller-supplied stale root objects. Built-in compound gestures should emit a combined operation where possible, but sibling path updates must compose even if they originate from different widgets.

A temporary isolated React class probe verified this checkpoint approach for accepting, transforming, and rejecting parents (3 passing cases). It did not validate the full Form implementation, StrictMode, or child effects; the acceptance tests below are required before shipping.

Extract pure render-context derivation separately from data transitions. Schema utilities, registry, field paths, and resolved schema must correspond to current props/data at render time. Keep useful memoization and validator schema-reference caching, and key it by input reference: with the reconciler gone, render-context derivation runs for every accepted prop update, so an unchanged input must be a lookup rather than a recomputation. `Form` already compares the props whose values may hold functions (`IDENTITY_PROP_KEYS`) with `replaceEqualDeep`, functions by identity, and the rest with `deepEquals` (rjsf-team#5217 part 2) and shares derived state against the previous state, so render-context values keep their references and the registry is retained by identity; `SchemaUtils.retrieveSchema()` caches its last call per input schema the same way. The default-state and validation steps need the same last-call cache on the `Form` instance. For validation the key is its full input set: the data, the schema, `validator`, `customValidate`, `transformErrors`, `uiSchema`, `extraErrors`, `liveValidate` and `noValidate`. That cache is the general form of the `isStateDataChanged` and `isIdentityPropChanged` flags that gate live validation in `getSnapshotBeforeUpdate` today; they retire with the reconciler rather than being extended. The `deepEquals` fallback that still re-derives state on any other prop change exists only to preserve the controlled snap-back; it goes with the synchronizer in PR 3. Do not globally rewrite memoization. Changed callbacks and validators must not be ignored: `deepEquals` treats all functions as equal, so it must not gate an update; shallow comparison and `replaceEqualDeep`, which compares functions by identity, are the comparators to use.

Remove `getSnapshotBeforeUpdate` and `componentDidUpdate` logic that reconciles controlled data. Remove `isProcessingUserChange` once its ownership purpose disappears. Lifecycle methods may remain for uncontrolled compatibility notifications, validation metadata, or an explicitly guarded uncontrolled schema transition. They must not arbitrate ownership or call a generic props-to-form-data synchronizer.

`getStateFromProps` must stop selecting owners and mixing render derivation with generic value synchronization. Its domain algorithms can remain in extracted helpers. Removing clear/default workarounds, sanitizer cycle handling, all stored derivations, or all pending queues is not an acceptance requirement for this milestone.

## 5. Nested fields and domain regressions

Arrays may keep row keys as UI metadata, but rejected controlled add/remove/reorder proposals must not leave optimistic item values visible. Preserve keys/focus for accepted operations where currently supported. Test duplicate equal items and external replacement. Do not broaden this into a new array identity scheme.

oneOf/anyOf selection may remain local because data can match several branches. For rejected proposals, authoritative data must still render consistently: rematch if incompatible with the chosen branch; retain an explicit choice when multiple branches remain compatible. Preserve accepted branch-switch defaults/sanitization and null-to-object behavior. Remove timing flags only when tests establish they are unnecessary.

Audit these concrete paths end to end: `MultiSchemaField.onOptionChange`, `ObjectField.handleKeyRename` (including its `formDataRef`), and `useAltDateWidgetProps.handleClear` in `packages/utils/src/useAltDateWidgetProps.tsx`. At review time each handler contained one direct `onChange`, so do not assume each is a confirmed multi-emit bug. Test follow-on effects, sibling changes, and rejected updates as well as the direct handler.

The near-simultaneous-change regression in `Form.handlers.test.tsx` uses two effect-driven widgets and a callback that merges into an external variable. Keep its domain coverage, but add a real React parent using exactly `setData(event.formData)`; the old harness does not establish controlled composition. Include the dependent-field-clear scenario from [issue #3367](https://github.com/rjsf-team/react-jsonschema-form/issues/3367): a second custom field calls `onChange(null)` from an effect when the first field changes, and the clear is sometimes lost.

Keep tests for clearing defaulted fields, undefined object leaves, array-item null clearing, additional-property deletion/rename, conditional defaults, and validation errors. Existing edit-time whole-form default passes and workarounds may remain behind the shared pipeline for now. Do not change global utils behavior to accommodate the refactor.

Keep schema/field/external error sources correctly associated with the data they describe. Rejected proposal validation must not replace displayed errors for authoritative data. Existing error provenance/caches can be adapted; a new observer or subscription architecture is not required. Fix errors that depend on a parent echo in both modes through the actual accepted/current-value change path.

## 6. Acceptance tests: new contracts and existing regression coverage

Add focused ownership tests in `packages/core/test/Form.ownership.test.tsx`. Use real accepting/rejecting/transforming parent harnesses. A spy without a React parent update is a rejecting controlled harness. Use a single `fireEvent.change` when asserting one operation's callback count.

### Six contract tests that gate the ownership switch

| Contract                    | Required evidence                                                                                                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fixed controlled data       | An edit emits a proposal but cannot change rendered data without parent acceptance.                                                                                                                            |
| Accepted/transformed update | A plain accepting parent updates correctly; a transforming parent's value wins. Neither causes a data-echo callback.                                                                                           |
| External replacement        | Props render immediately without a stale-data commit; unrelated rerenders do not reset data. Use a render/layout-effect recorder, not only the final DOM.                                                      |
| Controlled reset            | Local errors clear, loaded data stays, `onChange` is not called, and no default computation is triggered. Parent can replace data and clear local errors without an old-value echo.                            |
| No controlled defaults      | Controlled mount, a semantic schema change, and a data-only replacement emit no `onChange`. A parent seeded with `schemaUtils.getDefaultFormState` renders the defaults on the first render. Cover StrictMode. |
| Controlled composition      | Two path changes within one `act` retain both with exactly `setData(event.formData)` as the parent handler. A transformed first value survives; a rejected first value is not resurrected.                     |

The composition test must issue two path changes synchronously inside one `await act(async () => { ... })`, without a delay or rerender between calls, through actual Form/field callbacks. After React settles, assert the DOM, submitted model, and final callback retain both. Repeat with sibling mount effects and the dependent-field clear above. Do not weaken it to one root replacement or an external object-merge handler.

### Reuse or extend existing regression tests

These are coverage requirements, not 18 more mandatory new test cases. Map them to existing suites and add tests only for gaps introduced by this work:

- Mode inference; null/false/zero/empty-string roots; a controlled root becoming undefined after mount; optional undefined forwarding through a prop-spreading wrapper. Add the three diagnostics, including the missing-handler check with its readonly/disabled/handler suppressions, and assert that a controlled root becoming undefined does not warn.
- Both asynchronous-data patterns from section 8: a keyed remount after load, and a `record ?? {}` fallback. The broken version must produce the mode-change warning and keep uncontrolled ownership.
- Uncontrolled initialization, post-mount default notifications, latest-seed reset, guarded schema transitions, and ordered write composition after commit.
- Existing blur validation/omission and error-only notifications; controlled rejection; submit omission in both modes; getter/submit reading the owner; error provenance and field/ancestor error clearing.
- Queue progress with no handler, rejection, reentrant handlers, and unmount. Scheduling state must never appear as form data.
- Array add/remove/reorder with acceptance/rejection and existing key/focus behavior. MultiSchemaField option switch, ObjectField rename, and AltDateWidget clear alongside a sibling change, including follow-on effects and rejected updates.
- Defaulted-field clearing, dependencies, null/object branches, ambiguous selections, additional properties, and explicit root replacement.
- StrictMode notification uniqueness, immutable caller inputs, replacement callbacks/validators, and plain/themed legacy refs plus the new handle/getter.

### Render stability

`packages/core/test/renderStability.test.tsx` (rjsf-team#5217 part 2) counts renders per field through a counting `FieldTemplate` and asserts that an update re-renders no field outside the branch it touched. Its nine scenarios stay green through PR 2 and PR 3 with no loosened count: typing at the top level, in a nested object, in an array item and in a layout grid cell; a controlled parent accepting each proposal, which also asserts every proposal shares its unchanged subtrees with the value it was applied to; live validation on change with a sibling's unchanged error; live validation on blur; a submit that changes no errors; and a parent re-render with rebuilt but equal props, including inline JSX in the `uiSchema`, an inline `formContext` and an inline callback. A change that re-renders every field to make a contract test pass is not an acceptable fix.

PR 3 extends the file with the cases single ownership makes well defined. Each asserts its baseline count exists first, so a renamed id cannot pass vacuously:

| Scenario                                     | Expected renders                                                                                                                                           |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rejected controlled proposal                 | Only the proposing field's branch; the rejected value is not visible anywhere, and siblings are untouched.                                                 |
| Transforming parent                          | Only the field whose value the parent transformed.                                                                                                         |
| `extraErrors` replaced                       | Only the fields whose errors changed; a deep-equal replacement re-renders none.                                                                            |
| oneOf/anyOf option switch                    | Nothing outside the switched branch.                                                                                                                       |
| Array add, remove and reorder                | Items whose data and position are unchanged keep their count; with row keys retained, adding at the end re-renders no existing item.                       |
| Controlled reset                             | Only the fields whose errors cleared; data fields with no error keep their count, since the reset leaves data to the parent.                               |
| Uncontrolled schema or default option change | Fields whose resolved schema is unchanged keep their count, which holds because `retrieveSchema()` and the render-context caches share unchanged subtrees. |

The old numbered acceptance matrices are superseded by these six contract tests and the regression coverage map. Do not duplicate established tests solely to satisfy an ID, add skipped deferred-API tests, or drop regression coverage because it is no longer separately numbered.

## 7. Implementation and review sequence

### PR 1a: Additive public access and types (open, rjsf-team#5289)

1. `getFormData()` returning `this.state.formData` in both modes, with TSDoc stating the committed-read timing. It does not claim the future ownership contract; the switch changes its source, not its meaning.
2. `FormHandle` exported from `@rjsf/core`; `Form implements FormHandle` so the compiler enforces the contract. The ref prop is unchanged for the reason in section 3.6.
3. Runtime and `expectTypeOf` coverage in `packages/core/test/Form.handle.test.tsx`: both modes, themed form, legacy class ref, and the absence of `state`/lifecycle members from the handle.
4. Upgrade guide: reading `.state` through a ref is deprecated with a stop/use table; `getFormData()` documented against the `value`/`defaultValue` analogy. `internals.md` documents the handle.

The inventory found no `.state.formData` reads outside `Form.tsx`; tests read `state.errorSchema`, `state.errors`, and `state.schemaUtils`, which section 3.6 allows to remain. Nothing was migrated because nothing needed it. No mode inference, diagnostics, reset change, or reconciliation removal is included.

### PR 1b: Event type decoupling (after #5280)

Decouple `IChangeEvent` from `Pick<FormState, ...>` while preserving every current field and type. It is the same line #5280 rewrites when it removes `fieldPathId`, and is a ten-line change once that lands. Do not open it earlier.

### PR 2: Internal preparation and fixture classification

1. Extract shared edit processing, initialization, and render-context derivation without changing domain algorithms, callback timing, reset behavior, or ownership. Preserve useful queue behavior. Move the `replaceEqualDeep` passes in `Form` (`setSharedState`, `getSnapshotBeforeUpdate` and the `IDENTITY_PROP_KEYS` gate) into the extracted `applyChange` and render-context steps, and add the reference-keyed caches section 4 describes.
2. Add accepting/rejecting/transforming parent harnesses. Classify existing editable seeded fixtures and migrate ones whose behavior can be preserved with `initialFormData` or a genuine accepting parent.
3. Keep tests specifically asserting legacy hybrid behavior unchanged until PR 3. Do not mechanically rename test inputs or assert future ownership semantics in a behavior-preserving PR.
4. Prepare targeted child changes in separate reviewable commits where they can preserve current behavior. Defer fixes inherently dependent on rejection semantics to PR 3.

Exit: existing behavior passes and the later ownership diff is smaller. No public API advertises strict behavior that is not implemented. The mode resolver planned here was dropped: it is `props.formData !== undefined`, one line with no consumer until PR 3, so it lands there with its unit tests.

### PR 3: Atomic ownership switch and necessary child fixes

1. Add the mode resolver (`props.formData !== undefined`, selected once at construction) with unit tests for the section 3.1 table, activate frozen ownership, and add the three development diagnostics. These belong with the behavior they describe.
2. Route render, getter, edits, reset, blur, submit, and validation through authoritative data. Preserve the operation queue and controlled commit checkpoints.
3. Remove controlled value reconciliation and suppression flags; retain existing uncontrolled compatibility notifications. No lifecycle method computes defaults for a controlled form.
4. Apply the minimum array/branch/object/widget fixes needed for rejected controlled proposals. Keep each subsystem in a separate coherent commit; do not ship a parent ownership change with children that still display rejected values.
5. Change only the remaining intentionally broken test expectations, implement the six contract tests, and satisfy the regression coverage map.
6. Include necessary consumer migrations and the headline release warning before merging. Do not leave the playground or theme packages broken between PRs.

Exit: strict ownership works end to end while the class remains. Getter/handle/type additions and most mechanical fixture edits have already been reviewed. The ownership switch and inseparable rejection fixes remain atomic; splitting them into independently broken releases is not a review improvement.

### PR 4: Remaining documentation and examples

Can be commits in PR 3 if needed for a self-contained release. Must land before release.

1. Complete current API docs/examples and the active breaking-release changelog. Do not rewrite historical docs.
2. Lead with the seeded-form rename. Explain inferred ownership frozen at mount, both asynchronous-data patterns, parent-seeded controlled defaults, queue composition, committed-state getter timing, errors-only controlled reset, parent-chosen reset values, and retained blur notifications.
3. Audit theme prop/ref forwarding, run repository checks, and inspect snapshot changes individually.

Exit: all consumers and docs match the released contract. No premature mode warning or partially implemented strict mode is published, and both asynchronous-data patterns are documented.

## 8. Intentional breaking changes and migration examples

**Start the migration guide here: rename `formData` to `initialFormData` for editable seeded forms unless the parent accepts `onChange` into the supplied data.** Do not rename fixed controlled views or intentionally controlled editing harnesses. A callback that only logs or stores an unrelated variable is not sufficient.

The authorized breaks are limited to:

- Fixed controlled data no longer remains editable without parent acceptance.
- Defined-value mode inference at mount and stable ownership replace the hybrid behavior. A form that mounts without `formData` stays uncontrolled even when `formData` arrives later; see the asynchronous-data patterns below.
- Controlled forms no longer generate defaults. Mount, schema changes, and data replacements emit no `onChange`; the parent seeds defaults with `schemaUtils.getDefaultFormState`. Parent data wins, including null/undefined.
- Controlled `reset()` clears local errors without changing/re-defaulting data or emitting `onChange`. The parent chooses all reset values. The removed controlled reset notification is an explicit callback break.
- Controlled path operations retain composition with a synchronously accepting parent through serialized commits. Queued callback delivery may span commits; independent caller-supplied root replacements remain replacements.
- Controlled submit omission cannot silently overwrite internal current data.
- Current data is no longer available through a controlled `.state.formData`; use `getFormData()` or event payloads.
- Uncontrolled default notifications move out of the constructor to post-mount and retain their existing condition. A controlled mount emits nothing.

Do not remove blur error notifications, change uncontrolled reset baselines, change uncontrolled success-time submit storage, or redesign edit-time defaults as incidental breaks.

```tsx
// Editable seeded form: change the prop name.
<Form schema={schema} validator={validator} initialFormData={record} />;

// Controlled form: parent owns the value, including its defaults, and accepts proposals.
const schemaUtils = createSchemaUtils(validator, schema, experimental_defaultFormStateBehavior);
const [data, setData] = useState(() => schemaUtils.getDefaultFormState(schema, record));
<Form schema={schema} validator={validator} formData={data} onChange={(event) => setData(event.formData)} />;
```

A controlled parent that wants schema defaults computes them once with `createSchemaUtils(...).getDefaultFormState(schema, seed)`, passing the same default-configuration options it passes to `<Form>`. That is two lines and the only added migration step for controlled forms. It also fixes first-render and server output, which a post-mount proposal never could. A parent that changes the schema recomputes if it wants new defaults; the form does not do it on the parent's behalf. Uncontrolled forms are unchanged: `initialFormData` is seeded internally exactly as today.

### Asynchronously loaded data

A record that arrives after mount is the one case an explicit mode prop would have covered. It is covered instead by two documented patterns, following [TanStack Form's guidance for the same problem](https://tanstack.com/form/latest/docs/framework/react/guides/async-initial-values). Both must be in the migration guide, because the broken version looks reasonable:

```tsx
// Broken: mounts uncontrolled while `record` is undefined, then the arriving
// record is ignored and the mode-change warning fires.
<Form schema={schema} validator={validator} formData={record} onChange={onChange} />
```

**Pattern 1, mount after the data arrives. Recommend this one.** Keying by record identity makes switching records an explicit remount rather than a silent re-seed.

```tsx
if (!record) {
  return <Spinner />;
}
return <Form key={recordId} schema={schema} validator={validator} formData={record} onChange={onChange} />;
```

**Pattern 2, mount immediately with a complete fallback value.** This is React's documented `value={someValue ?? ''}` rule applied to a JSON root: supply the empty model for the root type, `{}` for an object, `[]` for an array, `''` for a string.

```tsx
<Form schema={schema} validator={validator} formData={record ?? {}} onChange={onChange} />
```

Pattern 2 renders an editable empty form while loading, so an edit made in that window races the arriving record. Prefer pattern 1 whenever the form is editable before data lands.

Neither pattern is specific to RJSF. React's input documentation gives the same fix for `value` from an API, and the store-owning libraries reach it from the other direction by re-seeding their own state. A background refetch landing while the user edits is a product decision, not something the form should resolve by overwriting in-progress input.

For controlled multi-field edits, prefer one parent functional update or an existing root-path replacement. Update local parent state promptly; debounce persistence instead of acceptance. Parent-controlled asynchronous ordering remains the parent's responsibility.

## 9. Deferred work, with separate decision gates

| Follow-up                        | Required decision before implementation                                                                                                                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default-policy simplification    | Define exactly when new branch/path defaults are inserted, which cleared values survive, and how cycles are handled. Then replace edit-time workarounds with domain tests.                                             |
| Reset ergonomics                 | Controlled reset is errors-only now. Any later baseline, saved-record, or schema-default reset API needs a concrete use case and a separately reviewed contract.                                                       |
| Data/validation event separation | Specify replacement observation before removing errors-only `onChange`; cover mount, blur, external errors, deduplication, and ordering.                                                                               |
| Additional imperative methods    | Demonstrate a concrete use case that existing root replacement/getter cannot serve. Do not add methods solely for symmetry.                                                                                            |
| Trimming `FormHandle`            | `validate` and `validateFormWithFormData` are stateless. Move them to utilities only in a later break, with a deprecation on the handle first.                                                                         |
| Function-component conversion    | After ownership review/stability, reuse the unchanged behavioral tests and `FormHandle`. Change the ref prop to `Ref<FormHandle>` here; consumers already narrowed to the handle need no change. No prop-copy effects. |
| Hook-created form instance       | A `useForm()`-style instance implies a form-owned store, the third architecture in the research review. Decide store-or-not first; the handle shape follows from that.                                                 |

These follow-ups are independent opportunities, not required milestones or permission to expand PR 3. No synchronous shadow store, subscription engine, or new performance claim is part of this plan.

Rejected, not deferred: a controlled defaults proposal on mount or schema change. An earlier revision of this document specified one, with a loop-prevention mechanism to contain it. It was removed on review because no surveyed library emits a data callback on mount, React's own controlled inputs never do, and the parent can compute the same defaults in two lines with the exported utility. Reintroducing it needs a use case the utility cannot serve, not a convenience argument.

## 10. Verification and completion

Run targeted suites during implementation:

```sh
pnpm --filter @rjsf/core test test/Form.ownership.test.tsx
pnpm --filter @rjsf/core test test/Form.behaviors.test.tsx test/Form.handlers.test.tsx test/Form.errors.test.tsx test/Form.defaults.test.tsx test/Form.state.test.tsx test/Form.props.test.tsx
pnpm --filter @rjsf/core test
```

Before completion run root checks:

```sh
pnpm run lint
pnpm run knip
pnpm run build
pnpm run typecheck
pnpm test
pnpm run cs-check
```

Inspect default and wrapped themes with controlled text, uncontrolled reset, dependency defaults, null/object branches, nested arrays, additional-property rename, and external errors. Check snapshot diffs individually.

- [ ] The six ownership contract tests and the existing domain/theme regression coverage map pass.
- [ ] Ownership is inferred from `formData` alone, frozen at mount, with no public mode prop.
- [ ] Controlled data has no persistent mirror or lifecycle arbitration.
- [ ] Both modes use the shared transition pipeline.
- [ ] Both modes retain path-change composition, with accepted/transformed/rejected controlled cases and no stronger getter timing guarantee.
- [ ] No controlled lifecycle defaults, errors-only controlled reset, and existing uncontrolled/default-edit/validation behavior pass their tests.
- [ ] `getFormData()` TSDoc states the committed-read timing.
- [ ] All changed expectations map to section 8; deferred API tests/features are absent.
- [x] Additive handle/getter/types landed first (PR 1a, rjsf-team#5289); legacy refs work and the deprecation is documented.
- [ ] Event type decoupling (PR 1b) and internal preparation (PR 2) were reviewed before the ownership switch.
- [ ] Class remains; retained lifecycle/state/queue uses have explicit purposes.

If an existing behavior conflicts with ownership, reduce it to a concrete reproduction and check section 8. Preserve unrelated behavior. Report an unresolved conflict rather than introducing another parent-echo flag, silently weakening a test, or implementing a deferred API to evade it.
