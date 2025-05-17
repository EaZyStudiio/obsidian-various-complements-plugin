export const groupBy = <T>(
  values: T[],
  toKey: (t: T) => string,
): { [key: string]: T[] } =>
  values.reduce(
    (prev, cur, _1, _2, k = toKey(cur)) => (
      (prev[k] || (prev[k] = [])).push(cur), prev
    ),
    {} as { [key: string]: T[] },
  );

export function uniq<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function uniqBy<T>(values: T[], fn: (x: T) => string | number): T[] {
  const m = new Map<string | number, T>();
  values.forEach((x) => {
    const k = fn(x);
    if (!m.has(k)) {
      m.set(k, x);
    }
  });
  return Array.from(m.values());
}

export function uniqWith<T>(arr: T[], fn: (one: T, other: T) => boolean) {
  return arr.filter(
    (element, index) => arr.findIndex((step) => fn(element, step)) === index,
  );
}

export function hasSameElement(arr1: unknown[], arr2: unknown[]): boolean {
  return arr1.some((x) => arr2.includes(x));
}

export function arrayEquals(
  arr1: unknown[],
  arr2: unknown[],
  length?: number,
): boolean {
  let l = Math.max(arr1.length, arr2.length);
  if (length !== undefined) {
    l = Math.min(l, length);
  }

  for (let i = 0; i < l; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;
}

export function arrayEqualsUntil(arr1: unknown[], arr2: unknown[]): number {
  let l = Math.min(arr1.length, arr2.length);
  for (let i = 0; i < l; i++) {
    if (arr1[i] !== arr2[i]) {
      return i - 1;
    }
  }

  return l - 1;
}

export function setEquals(set1: Set<unknown>, set2: Set<unknown>): boolean {
  if (set1.size !== set2.size) {
    return false;
  }

  return Array.from(set1).every((element) => set2.has(element));
}

export function equalsAsSet(ary1: string[], ary2: string[]): boolean {
  return setEquals(new Set(ary1), new Set(ary2));
}

export function mirrorMap<T>(
  collection: T[],
  toValue: (t: T) => string,
): { [key: string]: string } {
  return collection.reduce((p, c) => ({ ...p, [toValue(c)]: toValue(c) }), {});
}

export function max(collection: number[], emptyValue: number): number {
  const select = (a: number, b: number) => (a >= b ? a : b);
  return collection.reduce(select, emptyValue);
}
