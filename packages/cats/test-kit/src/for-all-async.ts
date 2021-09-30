/* eslint-disable prettier/prettier */
import { Eq } from '@cats4ts/cats-core';
import fc, { Arbitrary } from 'fast-check';
import { IsEq } from './rules';

export function forAllAsync<A0, R>(
  arb0: Arbitrary<A0>,
  predicate: (a0: A0) => Promise<IsEq<R>>,
): (E: Eq<R>) => () => Promise<void>;
export function forAllAsync<A0, R>(
  arb0: Arbitrary<A0>,
  predicate: (a0: A0) => boolean,
): () => Promise<void>;
export function forAllAsync<A0, A1, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  predicate: (a0: A0, a1: A1) => Promise<IsEq<R>>,
): (E: Eq<R>) => () => Promise<void>;
export function forAllAsync<A0, A1, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  predicate: (a0: A0, a1: A1) => boolean,
): () => Promise<void>;
export function forAllAsync<A0, A1, A2, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  predicate: (a0: A0, a1: A1, a2: A2) => Promise<IsEq<R>>,
): (E: Eq<R>) => () => Promise<void>;
export function forAllAsync<A0, A1, A2, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  predicate: (a0: A0, a1: A1, a2: A2) => boolean,
): () => Promise<void>;
export function forAllAsync<A0, A1, A2, A3, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3) => Promise<IsEq<R>>,
): (E: Eq<R>) => () => Promise<void>;
export function forAllAsync<A0, A1, A2, A3, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3) => boolean,
): () => Promise<void>;
export function forAllAsync<A0, A1, A2, A3, A4, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4) => Promise<IsEq<R>>,
): (E: Eq<R>) => () => Promise<void>;
export function forAllAsync<A0, A1, A2, A3, A4, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4) => boolean,
): () => Promise<void>;
export function forAllAsync<A0, A1, A2, A3, A4, A5, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => Promise<IsEq<R>>,
): (E: Eq<R>) => () => Promise<void>;
export function forAllAsync<A0, A1, A2, A3, A4, A5, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => boolean,
): () => Promise<void>;
export function forAllAsync<A0, A1, A2, A3, A4, A5, A6, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  arb6: Arbitrary<A6>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6) => Promise<IsEq<R>>,
): (E: Eq<R>) => () => Promise<void>;
export function forAllAsync<A0, A1, A2, A3, A4, A5, A6, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  arb6: Arbitrary<A6>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6) => boolean,
): () => Promise<void>;
export function forAllAsync<A0, A1, A2, A3, A4, A5, A6, A7, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  arb6: Arbitrary<A6>,
  arb7: Arbitrary<A7>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7) => Promise<IsEq<R>>,
): (E: Eq<R>) => () => Promise<void>;
export function forAllAsync<A0, A1, A2, A3, A4, A5, A6, A7, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  arb6: Arbitrary<A6>,
  arb7: Arbitrary<A7>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7) => boolean,
): () => Promise<void>;
export function forAllAsync<A0, A1, A2, A3, A4, A5, A6, A7, A8, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  arb6: Arbitrary<A6>,
  arb7: Arbitrary<A7>,
  arb8: Arbitrary<A8>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8) => Promise<IsEq<R>>,
): (E: Eq<R>) => () => Promise<void>;
export function forAllAsync<A0, A1, A2, A3, A4, A5, A6, A7, A8, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  arb6: Arbitrary<A6>,
  arb7: Arbitrary<A7>,
  arb8: Arbitrary<A8>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8) => boolean,
): () => Promise<void>;
export function forAllAsync<A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  arb6: Arbitrary<A6>,
  arb7: Arbitrary<A7>,
  arb8: Arbitrary<A8>,
  arb9: Arbitrary<A9>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9) => Promise<IsEq<R>>,
): (E: Eq<R>) => () => Promise<void>;
export function forAllAsync<A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  arb6: Arbitrary<A6>,
  arb7: Arbitrary<A7>,
  arb8: Arbitrary<A8>,
  arb9: Arbitrary<A9>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9) => Promise<boolean>,
): () => Promise<void>;
export function forAllAsync(
  ...args: any[]
): ((E: any) => () => void) | ((() => void)) {
  const [predicate] = args.splice(-1);
  const run = async (E?: Eq<unknown>) => {
    await fc.assert(
      // @ts-ignore
      fc.asyncProperty(...[...args, async (...args0) => {
        if (!E) return predicate(...args0);
        const { lhs, rhs } = await predicate(...args0);
        return E.equals(lhs, rhs);
      }]),
    )
  }

  return (...args: any[]) => {
    const [E] = args;
    return E != null ? (() => run(E)) : run()
  };
}

