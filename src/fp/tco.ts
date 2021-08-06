export function tco<T, A extends unknown[], R>(
  f: (this: T, ...args: A) => R,
): (this: T, ...args: A) => R {
  let active = false;
  let result: R;
  const accumulated: A[] = [];
  return function accumulator(this: T, ...accArgs: A): R {
    accumulated.push(accArgs);
    if (!active) {
      active = true;
      while (accumulated.length) {
        result = f.apply(this, accumulated.shift()!);
      }
      active = false;
      return result;
    }
    return undefined as any as R;
  };
}
