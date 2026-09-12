# Form public API: research review

Reviewed: 2026-09-11. Scope: public ownership, initialization, updates, reset, callbacks, and refs. This is a design review, not a performance benchmark or a claim that one library is universally best.

The revised [implementation specification](form-state-ownership-spec.md) is the implementation contract. This document distinguishes evidence from our recommendations. No runtime implementation has changed.

Review revision: 2026-09-12. The milestone retains strict ownership, now inferred from `formData` with no explicit mode prop, plus guarded controlled default proposals, errors-only controlled reset, and lossless operation serialization. Reset baselines/options, new setters/error-clearing methods, a validation observer, and synchronous pending-value reads remain deferred. These design records live in `rfcs/` because root `docs/` is deprecated.

## Conclusion

Keep the strict parent-owned versus form-owned distinction and retain the class for the behavioral migration. Keep existing public names and domain behavior where compatible with ownership. The research establishes useful precedents, but does not require adopting them all at once. Inferred mode handling with no new ownership prop, a supported getter/ref interface, and explicit default-proposal and controlled-reset rules belong in the first milestone. Broader default algorithms, baseline APIs, and event redesigns remain separate.

## What the primary sources establish

| Source                                                                                                                                               | Observed contract                                                                                                                                                                                                                                                         | Implication for this project                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [React input reference](https://react.dev/reference/react-dom/components/input)                                                                      | `value` controls the displayed value; `defaultValue` seeds it. Controlled edits require synchronous backing updates. Native text inputs must not switch ownership or receive null/undefined as their controlled text value. Missing change handlers produce a diagnostic. | Supports strict ownership and prompt acceptance. Does not establish a whole-form JSON-value API or prescribe runtime exceptions.                                                             |
| [React: sharing state](https://react.dev/learn/sharing-state-between-components)                                                                     | Each piece of state should have one owner. A component can combine prop-controlled data with local state for other concerns.                                                                                                                                              | Controlled form data can coexist with local errors, focus, row identity, and branch-selection metadata.                                                                                      |
| [React Hook Form: useForm documentation source](https://github.com/react-hook-form/documentation/blob/master/src/content/docs/useform.mdx)           | Cached `defaultValues` initialize a managed form. Reactive `values` updates can invoke internal reset behavior, with reset options controlling preservation.                                                                                                              | Reactive external synchronization is a different contract from a strict prop value. Do not label it inherently wrong; avoid recreating it accidentally in our strict mode.                   |
| [React Hook Form: reset documentation source](https://github.com/react-hook-form/documentation/blob/master/src/content/docs/useform/reset.mdx)       | Reset can supply replacement values and update defaults, with explicit retention options.                                                                                                                                                                                 | Explicitly loading a new baseline is a familiar operation. We need not copy its large options surface.                                                                                       |
| [Formik API](https://formik.org/docs/api/formik)                                                                                                     | `initialValues` initializes managed state. Reinitialization is opt-in. `resetForm` restores initial state or establishes a new baseline; `setValues` provides whole-form updates.                                                                                         | Supports cached initialization, explicit reset, and a named whole-form replacement method. Its setters belong to an owned store, not parent-rejected proposals.                              |
| [Mantine form values](https://mantine.dev/form/values/)                                                                                              | Distinguishes initialize, set values, set initial values, and reset. Reset restores the initial values. Submission can use transformed values.                                                                                                                            | Current value, reset baseline, and submitted representation are different concepts.                                                                                                          |
| [Mantine uncontrolled mode](https://mantine.dev/form/uncontrolled/)                                                                                  | The mode selects state-backed versus ref-backed form storage and changes how inputs receive values/defaults. It recommends uncontrolled mode for performance.                                                                                                             | This use of “controlled” is about the form-to-input boundary. Our modes are about who owns the entire JSON value and do not promise Mantine's performance characteristics.                   |
| [Mantine useUncontrolled source](https://github.com/mantinedev/mantine/blob/master/packages/@mantine/hooks/src/use-uncontrolled/use-uncontrolled.ts) | Chooses controlled value when it is not undefined; otherwise uses internal state initialized from defaults.                                                                                                                                                               | An optional prop forwarded as undefined should not unexpectedly select control. Own-property detection is surprising for ordinary wrappers.                                                  |
| [Final Form FormApi](https://final-form.org/docs/final-form/types/FormApi)                                                                           | A managed store exposes change, batch, getState, initialize, reset, and restart. Reset may install new initial values.                                                                                                                                                    | Public read and multi-field update operations deserve explicit names. Its notification batching is not a substitute for a parent accepting a controlled proposal.                            |
| [Ant Design Form](https://ant.design/components/form/)                                                                                               | The form manages field data, uses `initialValues` and imperative setters, and deliberately does not emit its user change callbacks for programmatic setters.                                                                                                              | Callback semantics vary across libraries. RJSF can keep imperative change proposals, but must document them instead of claiming they are native events.                                      |
| [uniforms forms](https://uniforms.tools/docs/api-reference/forms/)                                                                                   | Separates self-managed `AutoForm` from lower-level forms, distinguishes whole-model and field callbacks, and supports separate submit/validation model transforms.                                                                                                        | Closely related schema-form precedent for separating state ownership and submitted representations. Separate public components are an option, not necessary for this migration.              |
| [JSON Forms React integration](https://jsonforms.io/docs/integrations/react/) and [FAQ](https://jsonforms.io/faq/)                                   | Change notifications include validation and an initial notification; the FAQ describes feedback-loop risks when recreating data in the callback.                                                                                                                          | Positive precedent for an initial lifecycle notification. Our one-shot defaults proposal is a design choice beyond the documented initial validation event; the parent still owns its value. |
| [TanStack Form: async initial values](https://tanstack.com/form/latest/docs/framework/react/guides/async-initial-values)                             | A record loading after mount is handled by mounting the form only once data exists, which it recommends, or by mounting immediately with complete fallback values. `defaultValues` are a baseline, not a controlled value prop.                                           | Direct precedent for the asynchronous-data patterns in specification section 8, and evidence that no ownership selector is needed to serve that case.                                        |
| [JSON Schema annotations](https://json-schema.org/understanding-json-schema/reference/annotations)                                                   | `default` is an annotation; validation does not require insertion of missing values.                                                                                                                                                                                      | RJSF default population is a product feature. It can be explicit and scoped rather than mutating every controlled prop update.                                                               |

React Hook Form's documentation site returned HTTP 403 during this review, so its own GitHub documentation repository was used. These sources are living documentation, not a pinned cross-version compatibility guarantee. The uniforms page identifies itself as version 4.0.

## Two ownership boundaries, not one

These APIs solve different problems:

```text
Application owns value -> Form renderer -> controlled widgets

Application supplies initial data -> Form owns value -> controlled widgets

Application supplies initial data -> Form store -> subscribed or uncontrolled widgets
```

The first two are the proposed RJSF modes. The third is an alternative architecture used for different performance/interaction tradeoffs. Keeping two-way synchronization in a clearly identified store is not automatically an anti-pattern. The problem here is that the current `formData` API looks like the first model but often acts like the second.

This research does not support replacing native widgets with uncontrolled DOM inputs as part of the current change.

## Recommendations by implementation scope

### Implement now: ownership and explicit empty values

Retain `formData`, `initialFormData`, and `onChange`. Renaming to `value`/`defaultValue` would add migration work without fixing ownership.

Use defined-value inference at mount and freeze the chosen mode. No explicit mode prop. Null remains a JSON value. A controlled value can subsequently become undefined without handing ownership away. Use development warnings for conflicting data props, a missing handler, and attempted mode changes.

An earlier draft added `dataMode?: 'controlled' | 'uncontrolled'` as an escape hatch for a controlled root starting undefined. The survey below withdraws it. Inference matches what `Form.tsx` already computes, so it is existing behavior made strict, whereas the prop was the only new public concept in mode selection. Its `'uncontrolled'` member had no use case at all: it meant passing `formData` and having it silently ignored.

Rejected alternatives remain own-property detection, which is surprising for a wrapper that spreads `formData: undefined`, forbidding controlled undefined, and adding separate exported form components. Keep current component/ref structure and ordinary optional-prop forwarding.

### The asynchronous-data case, and how the field solves it

The one case an explicit mode covered is a record that loads after mount: `formData` is undefined on the first render, so the form infers uncontrolled and then ignores the arriving record. A survey of nine sources found **no library that solves this with an ownership selector**. They divide into two camps, and both point the same way.

**The form owns the value.** The application never passes a current value, so late data cannot select ownership. These libraries have a re-seeding problem instead, and every knob they added governs whether and how to re-seed, never who owns:

| Library         | Knob                                         | Documented meaning                                                       |
| --------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| Formik          | `enableReinitialize`                         | reset the form if `initialValues` changes, by deep equality, default off |
| React Hook Form | `values`, `resetOptions.keepDirtyValues`     | reactive re-seed that internally invokes `reset`, preserving user edits  |
| Final Form      | `keepDirtyOnReinitialize`                    | "only pristine values will be overwritten when `initialize()` is called" |
| Mantine         | `form.initialize()`                          | "can be used only once. Subsequent `form.initialize` calls are ignored"  |
| Ant Design      | `setFieldsValue`                             | "`initialValues` cannot be updated by `setState` dynamically"            |
| TanStack Form   | mount after load, or explicit `form.reset()` | `defaultValues` are a baseline, not a controlled value                   |

All of that maps onto RJSF's uncontrolled mode, meaning `initialFormData` and `reset()`. It is the opposite side of the split from an ownership prop.

**The caller owns the value**, which is RJSF's controlled mode. This camp holds React itself, JSON Forms, and uniforms' lower-level forms. None has a mode prop. React's input troubleshooting answers our exact case: "If your `value` is coming from an API or a state variable, it might be initialized to `null` or `undefined`. In that case, either set it to an empty string (`''`) initially, or pass `value={someValue ?? ''}`." JSON Forms' documented example seeds `useState` with a defined object. uniforms makes the controlled versus self-managed choice by which component you import, which is the separate-components alternative already rejected above.

[TanStack Form documents this scenario directly](https://tanstack.com/form/latest/docs/framework/react/guides/async-initial-values) and is the precedent the specification follows. Its two sanctioned answers are to mount the form only after data loads, which it recommends and which pairs with keying by record identity, or to mount immediately with complete fallback values. It also warns against overwriting in-progress input merely because a background query refreshed, which is a product decision rather than something the form should arbitrate.

Section 8 of the specification adopts both patterns. The mode-change warning becomes the only signal for the broken third version, so its message must name both fixes rather than merely report the attempt.

### A real gap this survey exposes, which is not the one the prop covered

Every store-owning library above ships a dirty-preserving re-seed. RJSF's uncontrolled mode has no equivalent: `initialFormData` is ignored after mount and `reset()` is all or nothing, so loading a record late into an uncontrolled form leaves remounting by key as the only supported path. Six libraries judged that problem worth solving and none judged an ownership selector worth adding.

This is evidence for promoting the deferred immutable-reset-baseline work, not for expanding this milestone. It needs its own contract covering baseline capture, dirty tracking, and conflict policy, none of which the ownership change requires.

### Implement now: shared transitions, composition, and supported reads

Both modes use the same edit pipeline. Only the final step differs: emit a proposal, or commit internally and notify. Existing domain algorithms can be extracted without redesigning them.

Retain the operation queue in controlled mode. Emitting two complete proposals against the same old props loses the first change with a plain `setData(event.formData)` parent. Instead, process one operation, give React a commit opportunity, then process the next against current props. Scheduling metadata is not a second value owner. A rejected first proposal must not be silently included in the second; a transformed accepted value must be retained.

An isolated React class probe of a `setState` callback checkpoint passed for accepting, transforming, and rejecting parents. That establishes feasibility, not production correctness. The specification requires real Form tests, sibling effects, update strategies, and rejection/unmount cases before shipping. [Issue #3367](https://github.com/rjsf-team/react-jsonschema-form/issues/3367) describes a dependent second field calling `onChange(null)` from an effect and sometimes failing to clear; the accepting-parent test must retain this class of behavior.

Add `getFormData()` and export a structural `FormHandle` implemented by the class. The getter reads controlled props or committed uncontrolled state, not queued proposals. Defer a named `setFormData` and public batch API; existing root replacement remains available.

Controlled parents must accept promptly with an ordinary state update. The form cannot promise composition against uncommitted delayed responses. React's update queue is relevant, but our existing value-callback contract does not automatically become a functional updater API. [React update queue guidance](https://react.dev/learn/queueing-a-series-of-state-updates)

### Implement now: defaults can be proposals

The earlier claim that strict ownership requires no controlled mount notification was too strong. Ownership constrains what is rendered and committed; it does not forbid proposing a defaulted value after commit.

On controlled mount or semantic schema/default-context change, compute with the existing utility and emit once if defaults change data. The form uses its own configuration, so normal accepting parents need not duplicate default preparation. Render remains prop-driven before and after any rejected proposal.

Do not retry on rejection, parent acceptance/transformation, data-only replacement, equal schema objects, or unrelated rerenders. Serialize lifecycle-originated requests with field operations and calculate against the latest data. Optional parent precomputation remains useful for prefilled first-render/SSR output, because post-commit proposals cannot fill that first output.

JSON Forms supplies a positive precedent for an initial notification. Its documented event reports initial validation; that alone does not establish our exact defaults-proposal or strict-rejection behavior. Those are explicit RJSF design decisions. [JSON Forms React integration](https://jsonforms.io/docs/integrations/react/)

### Implement now: controlled reset leaves data to the parent

Controlled `reset()` clears local errors, leaves data unchanged, and emits no `onChange`. The parent explicitly chooses whether to restore a saved record, clear values, or apply schema defaults. Uncontrolled reset retains the existing latest-initial-seed/current-schema behavior.

This replaces the previous schema-default proposal. That proposal was logically consistent with ownership, but accepting it could unexpectedly empty a loaded record. No ownership bug requires choosing that new reset target. The deciding criterion is migration risk and milestone scope, not that a defaults proposal is intrinsically invalid.

This is also different from the earlier draft that cleared errors and echoed unchanged data: the revised contract emits no controlled reset callback. Removing the old reset `onChange` is an explicit callback break and must be documented. It eliminates a notification with no data proposal and lets a parent replace data while clearing local errors without an old-value echo.

Mount/schema default proposals remain justified: they preserve useful initialization in the ordinary accepting-parent pattern with the form's own configuration. They do not imply that an explicit reset should choose a new target. Reset baselines, new arguments, and dedicated clear-errors methods remain deferred.

### Preserve now; reconsider separately: validation observation

Retain the existing event shapes and error-only blur notifications. Removing those notifications without an observer replacement would strand consumers. But introducing `onValidationChange` also requires decisions about mount timing, deduplication, error provenance, and ordering.

Defer that event redesign. Controlled parent updates must not echo data, while existing error-only events can still carry current authoritative data without requiring a data mirror. Document that `onChange` remains broader than a user data-change event during this milestone.

Move default notifications out of the constructor into guarded post-commit delivery. Uncontrolled notifications retain their existing condition; controlled notifications are one-shot proposals. Neither a value echo nor a validation-only event should start a new defaults loop.

### Preserve now; reconsider separately: defaults

Strict controlled ownership means no internal installation of generated data. Mount/schema default proposals retain convenience without moving ownership; data-only parent replacements do not trigger a new default proposal. Uncontrolled initialization stays internal.

Preserve edit-time default/sanitization algorithms and regressions behind the shared transition pipeline. Existing whole-form default passes, clear-value workarounds, and cycle handling can remain temporarily. Replacing those algorithms with scoped new-path initialization is a separate domain change.

Likewise, preserve characterized uncontrolled schema-change behavior using current state as input, and preserve uncontrolled success-time submit omission storage. Controlled omission cannot silently overwrite the supplied model. Do not turn that necessary ownership difference into a broader transformation-policy redesign.

### Later: function-component conversion

The sources support one owner and explicit API semantics, but do not require a function-component rewrite. Convert only after the ownership change is independently reviewed and stable, keeping behavioral tests and the exported handle unchanged. Do not replace removed lifecycles with effects copying props into current data.

## What this research does not authorize

No subscription engine, dirty/touched API suite, async initialization prop, new synchronous read/write store, general batching framework, validation-mode redesign, or broad prop renaming belongs in the first milestone.

Store-owning libraries can offer stronger immediate imperative guarantees because they own their state architecture. Adopting those guarantees would require a separate architectural decision here. No performance improvement is claimed without measurements.

The implementation specification now separates seven design-risk contract tests from a map of existing regression coverage. Earlier numbered matrices are superseded; this reduces ceremony without removing coverage. Deferred APIs remain opportunities, not pending implementation obligations.

## Review corrections and migration priority

The headline break is seeded forms that currently pass `formData` without accepting changes. Lead user-facing migration docs with the rename to `initialFormData`, except intentionally fixed views. A spy or logging callback does not make a fixture accepting.

The review correctly flagged lost composition and the deprecated folder. Its claim that MultiSchemaField switching, ObjectField renaming, and AltDateWidget clearing are all currently direct multi-emit handlers was not confirmed: each inspected handler has one direct callback. They remain named end-to-end regression targets because follow-on effects and optimistic local state can still affect ownership.

The `dataMode` escape hatch is withdrawn; see the asynchronous-data survey above. Ownership is inferred from `formData` alone. Additive access/type work and private mode resolution can land first, but activating frozen ownership is behavioral. Do not publish diagnostics describing strict behavior while the old hybrid remains active.

Keep mode-change and conflicting-prop diagnostics, and add the development mount warning for controlled data without a handler unless readonly/disabled. It catches a common migration mistake; refusing it to avoid a diagnostics framework was disproportionate. It cannot detect a logging-only handler, and it does not determine ownership.

## Reviewable delivery

Separate additive `getFormData`, `FormHandle`, and event-type decoupling from the behavioral switch. Before the switch, the getter returns the existing rendered state value; afterward it reads the selected owner. Its meaning stays current rendered data throughout.

A second preparation PR extracts internal logic, privately tests mode selection, and migrates compatible fixtures without changing behavior. The public mode prop and migration diagnostics activate with the ownership switch. Necessary child rejection fixes stay atomic with that switch, in separate reviewable commits, because a strict parent with optimistic child values is not a working intermediate release.

The seven focused contract tests gate this change, supplemented by existing domain regressions. Do not spend review attention duplicating tests just to satisfy a numbered matrix.
