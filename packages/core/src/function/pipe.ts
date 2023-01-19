// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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
