import { expectTypeOf } from 'vitest';

import type { EventFormData, FormState, IChangeEvent } from '../src/index.ts';

type EventKey = Exclude<keyof IChangeEvent, 'status'>;
type Mutable<O> = { -readonly [K in keyof O]: O[K] };
/** Two deliberate differences: the event narrows `formData` with `EventFormData`, pinned below, and carries its
 * proposal as `applyTo`, which the state has no counterpart for
 */
type SharedKey = Exclude<EventKey, 'formData' | 'applyTo'>;

/** The event is declared on its own, so nothing ties it to `FormState` any more. These assertions are what does: the
 * day the two drift apart on a shared member, this file stops compiling, and the drift becomes a deliberate decision
 * with a migration note instead of an accident of reshaping the state.
 */
describe('IChangeEvent', () => {
  it('carries the same members as FormState, with the same types', () => {
    expectTypeOf<EventKey>().toEqualTypeOf<
      'schema' | 'uiSchema' | 'schemaUtils' | 'formData' | 'applyTo' | 'errors' | 'errorSchema'
    >();
    expectTypeOf<Mutable<Pick<IChangeEvent, SharedKey>>>().toExtend<Pick<FormState, SharedKey>>();
    expectTypeOf<Pick<FormState, SharedKey>>().toExtend<Mutable<Pick<IChangeEvent, SharedKey>>>();
    expectTypeOf<IChangeEvent<{ a: string }>['formData']>().toEqualTypeOf<
      Exclude<FormState<{ a: string }>['formData'], undefined>
    >();
    expectTypeOf<IChangeEvent<string>['formData']>().toEqualTypeOf<FormState<string>['formData']>();
    expectTypeOf<IChangeEvent['status']>().toEqualTypeOf<'submitted' | undefined>();
  });

  it('types formData as T for an object or array root and adds undefined for a scalar one', () => {
    expectTypeOf<IChangeEvent<{ name: string }>['formData']>().toEqualTypeOf<{ name: string }>();
    expectTypeOf<IChangeEvent<string[]>['formData']>().toEqualTypeOf<string[]>();
    expectTypeOf<IChangeEvent<string>['formData']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<IChangeEvent<{ name: string } | null>['formData']>().toEqualTypeOf<
      { name: string } | null | undefined
    >();
    expectTypeOf<IChangeEvent['formData']>().toEqualTypeOf<unknown>();
    expectTypeOf<EventFormData<{ name: string } | undefined>>().toEqualTypeOf<{ name: string } | undefined>();
  });

  it('applies the proposal to a base of the same shape as formData', () => {
    expectTypeOf<IChangeEvent<{ name: string }>['applyTo']>().parameter(0).toEqualTypeOf<{ name: string }>();
    expectTypeOf<IChangeEvent<{ name: string }>['applyTo']>().returns.toEqualTypeOf<{ name: string }>();
    expectTypeOf<IChangeEvent<string>['applyTo']>().returns.toEqualTypeOf<string | undefined>();
  });

  it('is assignable to the event of a looser data type, so a handler typed with the default still fits', () => {
    // A handler written against `IChangeEvent` is passed the event of a typed form; `applyTo` must not stand in the way
    expectTypeOf<IChangeEvent<{ name: string }>>().toExtend<IChangeEvent>();
    expectTypeOf<(event: IChangeEvent) => void>().toExtend<(event: IChangeEvent<{ name: string }>) => void>();
  });

  it('cannot be written into', () => {
    const event = {} as IChangeEvent;
    // @ts-expect-error every member is readonly
    event.formData = {};
    // @ts-expect-error every member is readonly
    event.errors = [];
  });
});
