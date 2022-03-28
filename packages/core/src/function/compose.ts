// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
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
export function compose(...args: Function[]): (a: unknown) => unknown {
  return x => args.reduceRight((x, f) => f(x), x);
}
