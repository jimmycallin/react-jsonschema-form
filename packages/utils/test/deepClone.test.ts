import { deepClone } from '../src';

describe('deepClone()', () => {
  it('deeply clones plain data', () => {
    const value = { a: { b: [1, 2, { c: 'd' }] }, e: null };
    const clone = deepClone(value);
    expect(clone).toEqual(value);
    expect(clone).not.toBe(value);
    expect(clone.a).not.toBe(value.a);
    expect(clone.a.b[2]).not.toBe(value.a.b[2]);
  });
  it('clones data containing functions by copying the functions by reference', () => {
    const fn = () => 'x';
    const value = { a: { onClick: fn }, list: [fn] };
    const clone = deepClone(value);
    expect(clone).not.toBe(value);
    expect(clone.a).not.toBe(value.a);
    expect(clone.a.onClick).toBe(fn);
    expect(clone.list[0]).toBe(fn);
  });
  it('copies class instances by reference, preserving their prototype', () => {
    class Custom {
      value = 1;
      getValue() {
        return this.value;
      }
    }
    const instance = new Custom();
    const clone = deepClone({ nested: { instance } });
    expect(clone.nested.instance).toBe(instance);
    expect(clone.nested.instance.getValue()).toBe(1);
  });
  it('handles circular references in data containing functions', () => {
    const value: { fn: () => void; self?: unknown } = { fn: () => undefined };
    value.self = value;
    const clone = deepClone(value);
    expect(clone.self).toBe(clone);
    expect(clone.fn).toBe(value.fn);
  });
  it('clones objects with a null prototype', () => {
    const value = Object.assign(Object.create(null), { a: 1 });
    const clone = deepClone(value);
    expect(clone).not.toBe(value);
    expect(clone.a).toBe(1);
  });
  it('returns primitives as-is', () => {
    expect(deepClone(5)).toBe(5);
    expect(deepClone('str')).toBe('str');
    expect(deepClone(undefined)).toBeUndefined();
    expect(deepClone(null)).toBeNull();
  });
});
