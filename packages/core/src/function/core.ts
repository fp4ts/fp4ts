export interface Lazy<A> {
  (): A;
}

export const lazyVal = <A>(init: Lazy<A>): Lazy<A> => {
  let value: A | undefined;
  let initialized: boolean = false;
  return () => {
    if (!initialized) {
      initialized = true;
      value = init();
    }
    return value!;
  };
};

export const throwError = (e: Error): never => {
  throw e;
};

export const id: <A>(a: A) => A = x => x;
export const constant: <A>(a: A) => () => A = x => () => x;

export const fst: <A, B>(x: [A, B]) => A = ([a]) => a;
export const snd: <A, B>(x: [A, B]) => B = ([, b]) => b;

export const tupled = <A extends unknown[]>(...args: A): A => args;

export const flip: <A, B, C>(f: (a: A, b: B) => C) => (b: B, a: A) => C =
  f => (b, a) =>
    f(a, b);

export const curry: <A, B, C>(f: (a: A, b: B) => C) => (a: A) => (b: B) => C =
  f => x => y =>
    f(x, y);
export const uncurry: <A, B, C>(f: (a: A) => (b: B) => C) => (a: A, b: B) => C =
  f => (x, y) => f(x)(y);
