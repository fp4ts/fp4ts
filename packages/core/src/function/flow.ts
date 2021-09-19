/* eslint-disable @typescript-eslint/ban-types */
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
