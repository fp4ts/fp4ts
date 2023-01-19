// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable prettier/prettier */
import fc, { Arbitrary } from 'fast-check';
import { Eq } from '@fp4ts/cats';
import { IsEq } from '@fp4ts/cats-test-kit';
import { IO } from '@fp4ts/effect-core';

export function forAllM<A0, R>(
  arb0: Arbitrary<A0>,
  predicate: (a0: A0) => IsEq<R>,
): ((E: Eq<R>) => () => IO<void>)
export function forAllM<A0, R>(
  arb0: Arbitrary<A0>,
  predicate: (a0: A0) => IO<boolean | void>,
): () => IO<void>;
export function forAllM<A0, A1, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  predicate: (a0: A0, a1: A1) => IsEq<R>,
): ((E: Eq<R>) => () => IO<void>)
export function forAllM<A0, A1, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  predicate: (a0: A0, a1: A1) => IO<boolean | void>,
): () => IO<void>;
export function forAllM<A0, A1, A2, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  predicate: (a0: A0, a1: A1, a2: A2) => IsEq<R>,
): ((E: Eq<R>) => () => IO<void>)
export function forAllM<A0, A1, A2, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  predicate: (a0: A0, a1: A1, a2: A2) => IO<boolean | void>,
): () => IO<void>;
export function forAllM<A0, A1, A2, A3, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3) => IsEq<R>,
): ((E: Eq<R>) => () => IO<void>)
export function forAllM<A0, A1, A2, A3, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3) => IO<boolean | void>,
): () => IO<void>;
export function forAllM<A0, A1, A2, A3, A4, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4) => IsEq<R>,
): ((E: Eq<R>) => () => IO<void>)
export function forAllM<A0, A1, A2, A3, A4, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4) => IO<boolean | void>,
): () => IO<void>;
export function forAllM<A0, A1, A2, A3, A4, A5, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => IsEq<R>,
): ((E: Eq<R>) => () => IO<void>)
export function forAllM<A0, A1, A2, A3, A4, A5, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => IO<boolean | void>,
): () => IO<void>;
export function forAllM<A0, A1, A2, A3, A4, A5, A6, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  arb6: Arbitrary<A6>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6) => IsEq<R>,
): ((E: Eq<R>) => () => IO<void>)
export function forAllM<A0, A1, A2, A3, A4, A5, A6, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  arb6: Arbitrary<A6>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6) => IO<boolean | void>,
): () => IO<void>;
export function forAllM<A0, A1, A2, A3, A4, A5, A6, A7, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  arb6: Arbitrary<A6>,
  arb7: Arbitrary<A7>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7) => IsEq<R>,
): ((E: Eq<R>) => () => IO<void>)
export function forAllM<A0, A1, A2, A3, A4, A5, A6, A7, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  arb6: Arbitrary<A6>,
  arb7: Arbitrary<A7>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7) => IO<boolean | void>,
): () => IO<void>;
export function forAllM<A0, A1, A2, A3, A4, A5, A6, A7, A8, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  arb6: Arbitrary<A6>,
  arb7: Arbitrary<A7>,
  arb8: Arbitrary<A8>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8) => IsEq<R>,
): ((E: Eq<R>) => () => IO<void>)
export function forAllM<A0, A1, A2, A3, A4, A5, A6, A7, A8, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  arb6: Arbitrary<A6>,
  arb7: Arbitrary<A7>,
  arb8: Arbitrary<A8>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8) => IO<boolean | void>,
): () => IO<void>;
export function forAllM<A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, R>(
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
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9) => IsEq<R>,
): ((E: Eq<R>) => () => IO<void>)
export function forAllM<A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, R>(
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
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9) => IO<boolean | void>,
): () => IO<void>;
export function forAllM(...args: any[]): any {
  const [predicate] = args.splice(-1);
  const run = async (E?: any) => {
    await fc.assert(
      // @ts-ignore
      fc.asyncProperty(...[...args, (...args0) => {
        if (!E) return predicate(...args0).unsafeRunToPromise();
        return predicate(...args0)
          .map(({ lhs, rhs }: any) => E.equals(lhs, rhs))
          .unsafeRunToPromise();
      }]),
    )
  }

  return (...args: any[]) => {
    const [E] = args;
    return E != null ? (() => IO.deferPromise(() => run(E))) : IO.deferPromise(() => run())
  };
}
