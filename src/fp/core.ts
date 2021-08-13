/* eslint-disable @typescript-eslint/ban-types */

export interface Lazy<A> {
  (): A;
}

export const id: <A>(a: A) => A = x => x;
export const constant: <A>(a: A) => () => A = x => () => x;

export const fst: <A, B>(x: [A, B]) => A = ([a]) => a;
export const snd: <A, B>(x: [A, B]) => B = ([, b]) => b;

export const flip: <A, B, C>(f: (a: A, b: B) => C) => (b: B, a: A) => C =
  f => (b, a) =>
    f(a, b);

export const curry: <A, B, C>(f: (a: A, b: B) => C) => (a: A) => (b: B) => C =
  f => x => y =>
    f(x, y);
export const uncurry: <A, B, C>(f: (a: A) => (b: B) => C) => (a: A, b: B) => C =
  f => (x, y) => f(x)(y);

export function pipe<A>(a: A): A;
export function pipe<A, B>(a: A, ab: (_: A) => B): B;
export function pipe<A, B, C>(a: A, ab: (_: A) => B, bc: (_: B) => C): C;
export function pipe<A, B, C, D>(
  a: A,
  ab: (_: A) => B,
  bc: (_: B) => C,
  cd: (_: C) => D,
): D;
export function pipe<A, B, C, D, E>(
  a: A,
  ab: (_: A) => B,
  bc: (_: B) => C,
  cd: (_: C) => D,
  de: (_: D) => E,
): E;
export function pipe<A, B, C, D, E, F>(
  a: A,
  ab: (_: A) => B,
  bc: (_: B) => C,
  cd: (_: C) => D,
  de: (_: D) => E,
  ef: (_: E) => F,
): F;
export function pipe<A, B, C, D, E, F, G>(
  a: A,
  ab: (_: A) => B,
  bc: (_: B) => C,
  cd: (_: C) => D,
  de: (_: D) => E,
  ef: (_: E) => F,
  fg: (_: F) => G,
): G;
export function pipe<A, B, C, D, E, F, G, H>(
  a: A,
  ab: (_: A) => B,
  bc: (_: B) => C,
  cd: (_: C) => D,
  de: (_: D) => E,
  ef: (_: E) => F,
  fg: (_: F) => G,
  gh: (_: G) => H,
): H;
export function pipe<A, B, C, D, E, F, G, H, I>(
  a: A,
  ab: (_: A) => B,
  bc: (_: B) => C,
  cd: (_: C) => D,
  de: (_: D) => E,
  ef: (_: E) => F,
  fg: (_: F) => G,
  gh: (_: G) => H,
  hi: (_: H) => I,
): I;
export function pipe<A, B, C, D, E, F, G, H, I, J>(
  a: A,
  ab: (_: A) => B,
  bc: (_: B) => C,
  cd: (_: C) => D,
  de: (_: D) => E,
  ef: (_: E) => F,
  fg: (_: F) => G,
  gh: (_: G) => H,
  hi: (_: H) => I,
  ij: (_: I) => J,
): J;
export function pipe<A, B, C, D, E, F, G, H, I, J, K>(
  a: A,
  ab: (_: A) => B,
  bc: (_: B) => C,
  cd: (_: C) => D,
  de: (_: D) => E,
  ef: (_: E) => F,
  fg: (_: F) => G,
  gh: (_: G) => H,
  hi: (_: H) => I,
  ij: (_: I) => J,
  jk: (_: J) => K,
): K;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L>(
  a: A,
  ab: (_: A) => B,
  bc: (_: B) => C,
  cd: (_: C) => D,
  de: (_: D) => E,
  ef: (_: E) => F,
  fg: (_: F) => G,
  gh: (_: G) => H,
  hi: (_: H) => I,
  ij: (_: I) => J,
  jk: (_: J) => K,
  kl: (_: K) => L,
): L;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M>(
  a: A,
  ab: (_: A) => B,
  bc: (_: B) => C,
  cd: (_: C) => D,
  de: (_: D) => E,
  ef: (_: E) => F,
  fg: (_: F) => G,
  gh: (_: G) => H,
  hi: (_: H) => I,
  ij: (_: I) => J,
  jk: (_: J) => K,
  kl: (_: K) => L,
  lm: (_: L) => M,
): M;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
  a: A,
  ab: (_: A) => B,
  bc: (_: B) => C,
  cd: (_: C) => D,
  de: (_: D) => E,
  ef: (_: E) => F,
  fg: (_: F) => G,
  gh: (_: G) => H,
  hi: (_: H) => I,
  ij: (_: I) => J,
  jk: (_: J) => K,
  kl: (_: K) => L,
  lm: (_: L) => M,
  mn: (_: M) => N,
): N;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
  a: A,
  ab: (_: A) => B,
  bc: (_: B) => C,
  cd: (_: C) => D,
  de: (_: D) => E,
  ef: (_: E) => F,
  fg: (_: F) => G,
  gh: (_: G) => H,
  hi: (_: H) => I,
  ij: (_: I) => J,
  jk: (_: J) => K,
  kl: (_: K) => L,
  lm: (_: L) => M,
  mn: (_: M) => N,
  no: (_: N) => O,
): O;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
  a: A,
  ab?: (_: A) => B,
  bc?: (_: B) => C,
  cd?: (_: C) => D,
  de?: (_: D) => E,
  ef?: (_: E) => F,
  fg?: (_: F) => G,
  gh?: (_: G) => H,
  hi?: (_: H) => I,
  ij?: (_: I) => J,
  jk?: (_: J) => K,
  kl?: (_: K) => L,
  lm?: (_: L) => M,
  mn?: (_: M) => N,
  no?: (_: N) => O,
): unknown {
  switch (arguments.length) {
    case 1:
      return a;
    case 2:
      return ab!(a);
    case 3:
      return bc!(ab!(a));
    case 4:
      return cd!(bc!(ab!(a)));
    case 5:
      return de!(cd!(bc!(ab!(a))));
    case 6:
      return ef!(de!(cd!(bc!(ab!(a)))));
    case 7:
      return fg!(ef!(de!(cd!(bc!(ab!(a))))));
    case 8:
      return gh!(fg!(ef!(de!(cd!(bc!(ab!(a)))))));
    case 9:
      return hi!(gh!(fg!(ef!(de!(cd!(bc!(ab!(a))))))));
    case 10:
      return ij!(hi!(gh!(fg!(ef!(de!(cd!(bc!(ab!(a)))))))));
    case 11:
      return jk!(ij!(hi!(gh!(fg!(ef!(de!(cd!(bc!(ab!(a))))))))));
    case 12:
      return kl!(jk!(ij!(hi!(gh!(fg!(ef!(de!(cd!(bc!(ab!(a)))))))))));
    case 13:
      return lm!(kl!(jk!(ij!(hi!(gh!(fg!(ef!(de!(cd!(bc!(ab!(a))))))))))));
    case 14:
      return mn!(lm!(kl!(jk!(ij!(hi!(gh!(fg!(ef!(de!(cd!(bc!(ab!(a)))))))))))));
    case 15:
      // eslint-disable-next-line
      return no!(mn!(lm!(kl!(jk!(ij!(hi!(gh!(fg!(ef!(de!(cd!(bc!(ab!(a))))))))))))));
    default:
      return null;
  }
}

export function flow<A, B>(ab: (_: A) => B): (a: A) => B;
export function flow<A, B, C>(ab: (_: A) => B, bc: (_: B) => C): (a: A) => C;
export function flow<A, B, C, D>(
  ab: (_: A) => B,
  bc: (_: B) => C,
  cd: (_: C) => D,
): (a: A) => D;
export function flow<A, B, C, D, E>(
  ab: (_: A) => B,
  bc: (_: B) => C,
  cd: (_: C) => D,
  de: (_: D) => E,
): (a: A) => E;
export function flow<A, B, C, D, E, F>(
  ab: (_: A) => B,
  bc: (_: B) => C,
  cd: (_: C) => D,
  de: (_: D) => E,
  ef: (_: E) => F,
): (a: A) => F;
export function flow<A, B, C, D, E, F, G>(
  ab: (_: A) => B,
  bc: (_: B) => C,
  cd: (_: C) => D,
  de: (_: D) => E,
  ef: (_: E) => F,
  fg: (_: F) => G,
): (a: A) => G;
export function flow<A, B, C, D, E, F, G, H>(
  ab: (_: A) => B,
  bc: (_: B) => C,
  cd: (_: C) => D,
  de: (_: D) => E,
  ef: (_: E) => F,
  fg: (_: F) => G,
  gh: (_: G) => H,
): (a: A) => H;
export function flow<A, B, C, D, E, F, G, H>(
  this: Function,
  ab?: (_: A) => B,
  bc?: (_: B) => C,
  cd?: (_: C) => D,
  de?: (_: D) => E,
  ef?: (_: E) => F,
  fg?: (_: F) => G,
  gh?: (_: G) => H,
): (a: A) => unknown {
  switch (arguments.length) {
    case 1:
      return ab!;
    case 2:
      return a => bc!(ab!(a));
    case 3:
      return a => cd!(bc!(ab!(a)));
    case 4:
      return a => de!(cd!(bc!(ab!(a))));
    case 5:
      return a => ef!(de!(cd!(bc!(ab!(a)))));
    case 6:
      return a => fg!(ef!(de!(cd!(bc!(ab!(a))))));
    case 7:
      return a => gh!(fg!(ef!(de!(cd!(bc!(ab!(a)))))));
    default:
      return () => null;
  }
}

export function compose<A, B>(ab: (_: A) => B): (a: A) => B;
export function compose<A, B, C>(bc: (_: B) => C, ab: (_: A) => B): (a: A) => C;
export function compose<A, B, C, D>(
  cd: (_: C) => D,
  bc: (_: B) => C,
  ab: (_: A) => B,
): (a: A) => D;
export function compose<A, B, C, D, E>(
  de: (_: D) => E,
  cd: (_: C) => D,
  bc: (_: B) => C,
  ab: (_: A) => B,
): (a: A) => E;
export function compose<A, B, C, D, E, F>(
  ef: (_: E) => F,
  de: (_: D) => E,
  cd: (_: C) => D,
  bc: (_: B) => C,
  ab: (_: A) => B,
): (a: A) => F;
export function compose<A, B, C, D, E, F, G>(
  fg: (_: F) => G,
  ef: (_: E) => F,
  de: (_: D) => E,
  cd: (_: C) => D,
  bc: (_: B) => C,
  ab: (_: A) => B,
): (a: A) => G;
export function compose<A, B, C, D, E, F, G, H>(
  gh: (_: G) => H,
  fg: (_: F) => G,
  ef: (_: E) => F,
  de: (_: D) => E,
  cd: (_: C) => D,
  bc: (_: B) => C,
  ab: (_: A) => B,
): (a: A) => H;
export function compose(
  this: Function,
  ...args: Function[]
): (a: unknown) => unknown {
  return x => args.reduceRight((x, f) => f(x), x);
}
