# Form data ownership: specification and implementation plan

Status: proposed implementation contract for a breaking release. Documentation only; no runtime changes are included.

Review revision: 2026-09-11. This document supersedes earlier drafts. [The research review](form-state-api-research.md) supplies evidence and rationale. Guarded controlled defaults proposals and lossless queued changes are part of this milestone. Controlled reset leaves data to the parent, with no data proposal. A controlled value mirror is not part of the design.

**Migration headline: rename `formData` to `initialFormData` for an editable seeded form unless an `onChange` handler accepts updates into the supplied value.** A logging-only handler is not acceptance. Intentionally fixed/read-only controlled forms keep `formData`. Put this guidance first in release notes and the migration guide.

## 1. First milestone: establish ownership while keeping the class

Give form data exactly one owner. Controlled forms render the parent's value; uncontrolled forms own their value. Remove the machinery that reconciles two competing current values.

Keep `Form<T, S, F>` a class. Preserve existing schema-editing behavior and public notifications wherever they do not conflict with ownership. Do not combine this with a hooks conversion, a new default-generation algorithm, or a redesigned event/reset API.

### Required invariants

1. Controlled render, submit, and current-value validation read current `formData` props. No persistent optimistic value or state mirror may override them.
2. Uncontrolled render, submit, and current-value validation read committed internal state. Unrelated prop changes never restore the initial seed.
3. Both modes use one shared change pipeline; only committing data differs.
4. A data-only parent update never causes a data-echo `onChange`. A committed mount or semantic schema/default-configuration change may initiate one defaults proposal; it never installs data internally.
5. Existing field/default/validation regressions remain covered. Do not weaken unrelated behavior to make ownership tests pass.
6. Caller-owned data, schemas, and errors are never mutated.
7. Retain lossless serialization of accepted controlled path changes. No new synchronous form store, optimistic value mirror, or read-before-commit guarantee is introduced.

### Scope boundary

| Implement now                                                         | Defer to separately specified work                                                  |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Strict value ownership and explicit controlled-undefined support      | Function-component conversion                                                       |
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

The existing reset regression allows editing fixed `formData` without parent acceptance, then restores it after `disabled` changes. Those two tests passed during initial analysis. The controlled expectation is intentionally changed by this milestone; the uncontrolled expectation remains.

Inventory public refs and `.state` reads across the repository before editing types. Root `docs/README.md` marks that directory deprecated; these design records live in `rfcs/`. Published API/migration documentation belongs in `packages/docs`.

Budget for deliberate fixture migration in the form behavior, error, handler, and state tests. Classify editable seeded fixtures, accepting controlled fixtures, and intentionally fixed fixtures; do not mass-rename `formData` occurrences.

## 3. Public contract for this milestone

### 3.1 Mode selection

Retain `formData`, `initialFormData`, and `onChange`. Add only this ownership prop:

```ts
dataMode?: 'controlled' | 'uncontrolled';
```

Select once at construction:

```ts
const controlled = props.dataMode ? props.dataMode === 'controlled' : props.formData !== undefined;
```

Keep this owner for the instance. Explicit `dataMode='controlled'` supports a root starting at undefined. Once controlled, a later undefined value remains controlled. Null is a JSON value, not a request to fall back to initial data.

| Initial props                                              | Result                                                   |
| ---------------------------------------------------------- | -------------------------------------------------------- |
| Defined `formData`, including null/false/zero/empty string | Controlled, unless explicitly overridden.                |
| Omitted or undefined `formData`, no explicit mode          | Uncontrolled. Optional-prop forwarding behaves normally. |
| `dataMode='controlled'`, undefined `formData`              | Controlled empty root.                                   |
| Only `initialFormData`, or neither data prop               | Uncontrolled, initialized using existing defaults.       |
| Controlled plus defined `initialFormData`                  | Development warning; ignore initial data.                |
| Explicit uncontrolled plus defined `formData`              | Development warning; ignore controlled data.             |

Use simple development diagnostics for attempted mode change after mount and conflicting data props. The latter covers controlled plus defined initial data and explicit uncontrolled plus defined controlled data. A mounted inferred-uncontrolled form later receiving defined `formData` is an attempted mode change. Keep the original owner; do not throw or transfer ownership. Changing a React `key` starts a new instance. No warning registry or elaborate per-kind deduplication mechanism is required.

Add a development-only mount warning when the selected mode is controlled, `onChange` is absent, and neither `readonly` nor `disabled` is set. Use the selected mode so explicitly controlled undefined is covered too. The message should recommend `initialFormData` for seeded editing or an accepting `onChange` for controlled editing. A small instance boolean is sufficient to avoid repeating the mount warning under StrictMode; no diagnostics framework is needed. A logging-only handler cannot be detected by this check.

A fixed controlled value with no handler stays fixed; the warning does not select ownership. Document `readonly` for intentional fixed presentation. Keep diagnostics out of production.

Keep the existing large `FormProps` interface and generic inference. Do not add data-prop aliases or a complex union solely to enforce these combinations.

### 3.2 Controlled values

Render the exact current prop model. Missing values may have an empty widget representation, but this is not stored or submitted as new model data. An idle edit queue emits its first proposal synchronously; subsequent queued operations wait for a commit opportunity and use the latest props. Only the parent can accept a proposal.

Rejected proposals leave displayed values unchanged. Transformed/replaced parent values win immediately, without an old-data commit followed by lifecycle repair. Data-only parent updates do not emit data proposals.

After mount, compute defaults with the existing schema utility and the form's own default configuration. If the result differs from current data, emit one `onChange` proposal with no field id. Do the same after a semantic schema/default-configuration change commits. Never install the result internally. The normal `useState` plus accepting `onChange` pattern therefore receives defaults without duplicating configuration in the parent.

For each mount or committed schema/default-context transition, attempt this once, marking the attempt before notification. Unrelated rerenders, equal-valued schema objects, changed handlers, parent acceptance/transformation/rejection, and data-only replacements must not retry it. Compare schemas/default options by semantic value; respect changed default-algorithm function identity where relevant. Use existing context comparison helpers where correct. Do not retain a history keyed by every form value.

Process a defaults operation against the latest authoritative data when its queue turn runs, not a stale snapshot computed before child effects. If its schema context has been superseded, skip it; the newest committed context gets its own single attempt. Do not requeue on rejection or try to reach a normalization fixed point through lifecycle callbacks. A later semantic schema change or remount may deliberately request defaults again. Controlled reset is not a defaults trigger.

Render and submit continue to use props until acceptance. The first render/server output can therefore be empty before post-mount acceptance; callers needing prefilled first output may optionally prepare defaults themselves. Retain current edit-time defaults and sanitization algorithms; proposing defaults does not require redesigning them.

### 3.3 Uncontrolled values

Initialize from `initialFormData` plus existing schema-default behavior. Edits compose in internal state and notify through the existing callback shape. Later initial-data prop changes do not replace current data.

Preserve the existing documented reset use of the latest `initialFormData` and current schema. Do not introduce a captured reset baseline in this milestone.

An unrelated prop update must not rerun value initialization. For schema/default-configuration changes that currently transform uncontrolled data, preserve the characterized behavior using the current internal value as input, never the initial seed. Put this in a specifically guarded uncontrolled transition, separate from render-context derivation. Controlled schema/default-configuration changes derive render context and initiate the single post-commit defaults proposal above; they never rewrite the parent model internally.

### 3.4 Existing notifications, with a narrow compatibility boundary

Retain `onChange(event, id?)`, `onSubmit`, `onError`, `onBlur`, and `onFocus` signatures and existing event fields. Do not add `onValidationChange` yet.

| Cause                                                 | Milestone notification rule                                                                                                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User edit or `setFieldValue`                          | One proposal per operation in controlled mode; one committed result per operation in uncontrolled mode.                                                       |
| Parent accepts/transforms/replaces controlled data    | No data-echo `onChange`.                                                                                                                                      |
| Controlled mount                                      | One post-commit defaults proposal if defaults change current data; no constructor notification.                                                               |
| Controlled schema/default-context change              | One post-commit defaults proposal if needed; no retry from a data echo or rejection.                                                                          |
| Uncontrolled mount adds defaults to the supplied seed | Preserve the existing notification condition and payload, but deliver after mount rather than from the constructor.                                           |
| Blur validation/omission                              | Preserve existing change-notification conditions, including error-only changes. Controlled omission is a proposal; validation-only events carry current data. |
| Explicit reset                                        | Uncontrolled reset keeps its existing notification. Controlled reset emits no `onChange`.                                                                     |
| Uncontrolled schema/default transition changes data   | Preserve the characterized notification; no notification when only render context changes.                                                                    |

The retained `onChange` is not yet a data-only event. Document that it can report validation-only changes. When a parent echoes the same value from such an event, do not create a second notification. Default generation that leaves data unchanged emits no mount notification.

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

Set-then-immediate-read or set-then-immediate-submit before React commits has no new guarantee. For controlled forms, it cannot use a proposal the parent has not accepted. Tests and docs should wait for committed updates. Do not add `flushSync`, a synchronous shadow store, or queues replayed by getters to create a stronger API.

### 3.6 Imperative handle and event types

Export `FormHandle<T, S, F>` containing `getFormData` and the supported existing methods: `submit`, `reset`, `setFieldValue`, `validateForm`, `validateFormWithFormData`, `validate`, and `focusOnError`. Reuse current signatures. The class structurally implements this handle.

Type the public ref prop as `Ref<FormHandle<T, S, F>>`. Verify both handle refs and existing `createRef<Form<T, S, F>>()` consumers typecheck through plain/themed forms. Do not cast away incompatibilities. Keep the class export; remove lifecycle/state members only from the new handle, not by deleting unrelated class methods.

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

Uncontrolled operations must read the latest prior internal transition, using pure functional updates or the existing serial queue. Capture each operation's result for its callback; do not construct an old operation's event from later state. A queue for composing writes does not imply read-your-pending-writes semantics.

### Controlled queue: retain composition without a value mirror

Keep an ordered queue of operations, not precomputed whole-form snapshots or an optimistic current model. When idle, process the first operation against current props and emit its proposal. Before processing the next, allow React to commit the parent's synchronous response. Then read current props again and process the next operation.

A small internal state checkpoint and its `setState` callback can supply this scheduling boundary using the existing serial-queue structure. Its state contains only scheduling metadata, not form data. Set the busy guard before calling consumer code so reentrant changes enqueue rather than execute against stale props. Schedule the checkpoint after the proposal callback. Do not wait for data equality or acceptance: a rejected proposal still advances the queue after the checkpoint. Ensure the checkpoint callback runs with every supported component-update strategy.

Example: starting from `{ a: '', b: '' }`, queue `a='first'` and `b='second'` within one `act`. An accepting parent commits the first before the second is processed, so the final model contains both. If the parent transforms `a` to `'FIRST'`, the second proposal preserves that. If it rejects the first, the second proposal must preserve the old `a`; never resurrect a rejected value.

This relies on the normal controlled-input contract: the parent accepts with a prompt ordinary state update. A delayed or transition-priority parent update is not a committed value to compose against. Never merge a late parent response into current data yourself. Do not add timers, `flushSync`, an unbounded draft, or a public batching API.

Lifecycle-originated default requests use the same serialized operation mechanism and are computed against current props when processed. Reset and reentrant edits preserve request order; an errors-only controlled reset advances the queue without notifying `onChange`. On unmount discard pending work; skip invalidated lifecycle-default requests. Handle callback failures without a permanently busy queue, following existing error propagation conventions.

For deliberate atomic full replacement, retain `setFieldValue([], nextObject)` or a parent update. A replacement is still a replacement; do not infer patches from two caller-supplied stale root objects. Built-in compound gestures should emit a combined operation where possible, but sibling path updates must compose even if they originate from different widgets.

A temporary isolated React class probe verified this checkpoint approach for accepting, transforming, and rejecting parents (3 passing cases). It did not validate the full Form implementation, StrictMode, child effects, or update strategies; the acceptance tests below are required before shipping.

Extract pure render-context derivation separately from data transitions. Schema utilities, registry, field paths, and resolved schema must correspond to current props/data at render time. Keep useful memoization and validator schema-reference caching. Do not globally rewrite memoization or `shouldRender`; ensure changed callbacks/validators cannot be ignored by a deep comparator that treats functions as equal.

Remove `getSnapshotBeforeUpdate` and `componentDidUpdate` logic that reconciles controlled data. Remove `isProcessingUserChange` once its ownership purpose disappears. Lifecycle methods may remain for guarded defaults proposals, compatibility notifications, validation metadata, or an explicitly guarded uncontrolled schema transition. They must not arbitrate ownership or call a generic props-to-form-data synchronizer.

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

### Seven contract tests that gate the ownership switch

| Contract                    | Required evidence                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fixed controlled data       | An edit emits a proposal but cannot change rendered data without parent acceptance.                                                                                                                          |
| Accepted/transformed update | A plain accepting parent updates correctly; a transforming parent's value wins. Neither causes a data-echo callback.                                                                                         |
| External replacement        | Props render immediately without a stale-data commit; unrelated rerenders do not reset data. Use a render/layout-effect recorder, not only the final DOM.                                                    |
| Controlled reset            | Local errors clear, loaded data stays, `onChange` is not called, and no default computation is triggered. Parent can replace data and clear local errors without an old-value echo.                          |
| Defaults proposal           | Mount and a semantic schema/default-context change propose defaults only when needed. An accepting parent receives them without duplicating configuration; rendering remains prop-owned until acceptance.    |
| Controlled composition      | Two path changes within one `act` retain both with exactly `setData(event.formData)` as the parent handler. A transformed first value survives; a rejected first value is not resurrected.                   |
| Defaults-loop prevention    | Rejection, transformation, data-only replacement, unrelated rerenders, and equal schema objects do not retry defaults. A later semantic context change may propose once. Cover StrictMode and child effects. |

The composition test must issue two path changes synchronously inside one `await act(async () => { ... })`, without a delay or rerender between calls, through actual Form/field callbacks. After React settles, assert the DOM, submitted model, and final callback retain both. Repeat with sibling mount effects and the dependent-field clear above. Do not weaken it to one root replacement or an external object-merge handler.

### Reuse or extend existing regression tests

These are coverage requirements, not 18 more mandatory new test cases. Map them to existing suites and add tests only for gaps introduced by this work:

- Mode inference and explicit controlled undefined; null/false/zero/empty-string roots; optional undefined forwarding; deterministic invalid-prop precedence. Add the missing-handler warning check and its readonly/disabled/handler suppressions.
- Uncontrolled initialization, post-mount default notifications, latest-seed reset, guarded schema transitions, and ordered write composition after commit.
- Existing blur validation/omission and error-only notifications; controlled rejection; submit omission in both modes; getter/submit reading the owner; error provenance and field/ancestor error clearing.
- Queue progress with no handler, rejection, reentrant handlers, unmount, and supported component-update strategies. Scheduling state must never appear as form data.
- Array add/remove/reorder with acceptance/rejection and existing key/focus behavior. MultiSchemaField option switch, ObjectField rename, and AltDateWidget clear alongside a sibling change, including follow-on effects and rejected updates.
- Defaulted-field clearing, dependencies, null/object branches, ambiguous selections, additional properties, and explicit root replacement.
- StrictMode notification uniqueness, immutable caller inputs, replacement callbacks/validators, and plain/themed legacy refs plus the new handle/getter.

The old numbered acceptance matrices are superseded by these seven contract tests and the regression coverage map. Do not duplicate established tests solely to satisfy an ID, add skipped deferred-API tests, or drop regression coverage because it is no longer separately numbered.

## 7. Implementation and review sequence

### PR 1: Additive public access and types

1. Inventory refs and `.state` reads, then add `getFormData()` returning the current rendered/committed value. Under the existing hybrid implementation this means `this.state.formData`, even when `formData` props exist. It must not claim the future ownership contract yet.
2. Export `FormHandle`, update compatible ref typing, and decouple `IChangeEvent` from internal state while preserving every current event field/type.
3. Migrate direct current-data reads to the getter where appropriate, and add type/runtime coverage for plain and themed refs. Keep legacy class refs working.
4. Do not activate mode inference, frozen ownership, new diagnostics, reset changes, or reconciliation removal in this PR.

Exit: additive methods/types and migrated reads land independently; existing behavior/tests pass. The later switch changes the getter's source to match the new owner, not its purpose of returning current rendered data.

### PR 2: Internal preparation and fixture classification

1. Add a private pure mode resolver and unit tests for the future rules. Do not expose an ignored public `dataMode` prop or let the resolver select the live data source yet.
2. Extract shared edit processing, initialization, and render-context derivation without changing domain algorithms, callback timing, reset behavior, or ownership. Preserve useful queue behavior.
3. Add accepting/rejecting/transforming parent harnesses. Classify existing editable seeded fixtures and migrate ones whose behavior can be preserved with `initialFormData` or a genuine accepting parent.
4. Keep tests specifically asserting legacy hybrid behavior unchanged until PR 3. Do not mechanically rename test inputs or assert future ownership semantics in a behavior-preserving PR.
5. Prepare targeted child changes in separate reviewable commits where they can preserve current behavior. Defer fixes inherently dependent on rejection semantics to PR 3.

Exit: existing behavior passes and the later ownership diff is smaller. The private resolver is preparation only; no public API advertises strict behavior that is not implemented.

### PR 3: Atomic ownership switch and necessary child fixes

1. Expose `dataMode`, activate the prepared resolver/frozen ownership, and add mode/conflict/missing-handler development diagnostics. These belong with the behavior they describe.
2. Route render, getter, edits, reset, blur, submit, and validation through authoritative data. Preserve the operation queue and controlled commit checkpoints.
3. Remove controlled value reconciliation and suppression flags; retain specifically guarded lifecycle defaults proposals and existing compatibility notifications.
4. Apply the minimum array/branch/object/widget fixes needed for rejected controlled proposals. Keep each subsystem in a separate coherent commit; do not ship a parent ownership change with children that still display rejected values.
5. Change only the remaining intentionally broken test expectations, implement the seven contract tests, and satisfy the regression coverage map.
6. Include necessary consumer migrations and the headline release warning before merging. Do not leave the playground or theme packages broken between PRs.

Exit: strict ownership works end to end while the class remains. Getter/handle/type additions and most mechanical fixture edits have already been reviewed. The ownership switch and inseparable rejection fixes remain atomic; splitting them into independently broken releases is not a review improvement.

### PR 4: Remaining documentation and examples

Can be commits in PR 3 if needed for a self-contained release. Must land before release.

1. Complete current API docs/examples and the active breaking-release changelog. Do not rewrite historical docs.
2. Lead with the seeded-form rename. Explain default proposals, queue composition, committed-state getter timing, errors-only controlled reset, parent-chosen reset values, and retained blur notifications.
3. Audit theme prop/ref forwarding, run repository checks, and inspect snapshot changes individually.

Exit: all consumers and docs match the released contract. No dormant/ignored mode prop, premature mode warning, or partially implemented strict mode is published.

## 8. Intentional breaking changes and migration examples

**Start the migration guide here: rename `formData` to `initialFormData` for editable seeded forms unless the parent accepts `onChange` into the supplied data.** Do not rename fixed controlled views or intentionally controlled editing harnesses. A callback that only logs or stores an unrelated variable is not sufficient.

The authorized breaks are limited to:

- Fixed controlled data no longer remains editable without parent acceptance.
- Defined-value mode inference at mount, explicit `dataMode`, and stable ownership replace the hybrid behavior.
- Controlled defaults proposals never install data internally. Mount and semantic schema changes can propose defaults once; data-only replacements no longer trigger normalization callbacks. Parent data wins until acceptance, including null/undefined.
- Controlled `reset()` clears local errors without changing/re-defaulting data or emitting `onChange`. The parent chooses all reset values. The removed controlled reset notification is an explicit callback break.
- Controlled path operations retain composition with a synchronously accepting parent through serialized commits. Queued callback delivery may span commits; independent caller-supplied root replacements remain replacements.
- Controlled submit omission cannot silently overwrite internal current data.
- Current data is no longer available through a controlled `.state.formData`; use `getFormData()` or event payloads.
- Default notifications move out of the constructor to post-mount. Uncontrolled notifications retain their existing condition; controlled notifications are proposals only.

Do not remove blur error notifications, change uncontrolled reset baselines, change uncontrolled success-time submit storage, or redesign edit-time defaults as incidental breaks.

```tsx
// Editable seeded form: change the prop name.
<Form schema={schema} validator={validator} initialFormData={record} />;

// Controlled form: parent accepts proposals.
const [data, setData] = useState({});
<Form
  schema={schema}
  validator={validator}
  dataMode='controlled'
  formData={data}
  onChange={(event) => setData(event.formData)}
/>;
```

An accepting controlled parent receives schema defaults after mount using the form's own configuration; a separate utility call is not required. Optional precomputation with exported `getDefaultFormState(validator, schema, initialData)` is available when first-render/SSR prefilling is needed. In that case match the form's root schema and default configuration. Keying an editor by record identity remains a straightforward way to initialize a different record.

For controlled multi-field edits, prefer one parent functional update or an existing root-path replacement. Update local parent state promptly; debounce persistence instead of acceptance. Parent-controlled asynchronous ordering remains the parent's responsibility.

## 9. Deferred work, with separate decision gates

| Follow-up                        | Required decision before implementation                                                                                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default-policy simplification    | Define exactly when new branch/path defaults are inserted, which cleared values survive, and how cycles are handled. Then replace edit-time workarounds with domain tests. |
| Reset ergonomics                 | Controlled reset is errors-only now. Any later baseline, saved-record, or schema-default reset API needs a concrete use case and a separately reviewed contract.           |
| Data/validation event separation | Specify replacement observation before removing errors-only `onChange`; cover mount, blur, external errors, deduplication, and ordering.                                   |
| Additional imperative methods    | Demonstrate a concrete use case that existing root replacement/getter cannot serve. Do not add methods solely for symmetry.                                                |
| Function-component conversion    | After ownership review/stability, reuse the unchanged behavioral tests and `FormHandle`. Migrate remaining class-ref types deliberately; no prop-copy effects.             |

These follow-ups are independent opportunities, not required milestones or permission to expand PR 3. No synchronous shadow store, subscription engine, or new performance claim is part of this plan.

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

- [ ] The seven ownership contract tests and the existing domain/theme regression coverage map pass.
- [ ] Controlled data has no persistent mirror or lifecycle arbitration.
- [ ] Both modes use the shared transition pipeline.
- [ ] Both modes retain path-change composition, with accepted/transformed/rejected controlled cases and no stronger getter timing guarantee.
- [ ] Guarded controlled defaults proposals, errors-only controlled reset, and existing uncontrolled/default-edit/validation behavior pass their tests.
- [ ] All changed expectations map to section 8; deferred API tests/features are absent.
- [ ] Additive handle/getter/types and internal preparation were reviewed before the ownership switch; legacy refs work and consumers/docs are migrated.
- [ ] Class remains; retained lifecycle/state/queue uses have explicit purposes.

If an existing behavior conflicts with ownership, reduce it to a concrete reproduction and check section 8. Preserve unrelated behavior. Report an unresolved conflict rather than introducing another parent-echo flag, silently weakening a test, or implementing a deferred API to evade it.
