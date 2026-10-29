/** Data contracts contain only plain serializable objects, arrays and primitives. */
export type DeepReadonly<T> = T extends readonly (infer Item)[]
  ? readonly DeepReadonly<Item>[]
  : T extends object ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> } : T;

/** Copy first: freezing a snapshot must never freeze the caller's data. */
export function immutableCopy<T>(value: T): DeepReadonly<T> {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((item: unknown) => immutableCopy(item))) as DeepReadonly<T>;
  }
  if (value !== null && typeof value === 'object') {
    const copy = Object.fromEntries(Object.entries(value).map(([key, item]: [string, unknown]) => [key, immutableCopy(item)]));
    return Object.freeze(copy) as DeepReadonly<T>;
  }
  return value as DeepReadonly<T>;
}
