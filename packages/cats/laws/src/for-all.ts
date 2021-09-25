/* eslint-disable prettier/prettier */
import { Eq } from '@cats4ts/cats-core';
import fc, { Arbitrary } from 'fast-check';
import { IsEq } from './results';

export function forAll<A0, R>(
  arb0: Arbitrary<A0>,
  E: Eq<R>,
  predicate: (a0: A0) => IsEq<R>,
): () => void;
export function forAll<A0, A1, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  E: Eq<R>,
  predicate: (a0: A0, a1: A1) => IsEq<R>,
): () => void;
export function forAll<A0, A1, A2, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  E: Eq<R>,
  predicate: (a0: A0, a1: A1, a2: A2) => IsEq<R>,
): () => void;
export function forAll<A0, A1, A2, A3, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  E: Eq<R>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3) => IsEq<R>,
): () => void;
export function forAll<A0, A1, A2, A3, A4, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  E: Eq<R>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4) => IsEq<R>,
): () => void;
export function forAll<A0, A1, A2, A3, A4, A5, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  E: Eq<R>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => IsEq<R>,
): () => void;
export function forAll<A0, A1, A2, A3, A4, A5, A6, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  arb6: Arbitrary<A6>,
  E: Eq<R>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6) => IsEq<R>,
): () => void;
export function forAll<A0, A1, A2, A3, A4, A5, A6, A7, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  arb6: Arbitrary<A6>,
  arb7: Arbitrary<A7>,
  E: Eq<R>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7) => IsEq<R>,
): () => void;
export function forAll<A0, A1, A2, A3, A4, A5, A6, A7, A8, R>(
  arb0: Arbitrary<A0>,
  arb1: Arbitrary<A1>,
  arb2: Arbitrary<A2>,
  arb3: Arbitrary<A3>,
  arb4: Arbitrary<A4>,
  arb5: Arbitrary<A5>,
  arb6: Arbitrary<A6>,
  arb7: Arbitrary<A7>,
  arb8: Arbitrary<A8>,
  E: Eq<R>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8) => IsEq<R>,
): () => void;
export function forAll<A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, R>(
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
  E: Eq<R>,
  predicate: (a0: A0, a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9) => IsEq<R>,
): () => void;
export function forAll(...args: any[]): () => void {
  const [E, predicate] = args.splice(-2);
  return () => {
    fc.assert(
      // @ts-ignore
      fc.property(...[...args, (...args0) => {
        const { lhs, rhs } = predicate(...args0);
        return E.equals(lhs, rhs);
      }]),
    );
  }
}
