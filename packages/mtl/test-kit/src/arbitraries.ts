// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { FlatMap } from '@fp4ts/cats';
import {
  IxRWS,
  IxRWST,
  IxStateT,
  Reader,
  RWS,
  RWST,
  State,
  StateT,
  Writer,
  WriterT,
} from '@fp4ts/mtl-core';

export const fp4tsIxRWST = <R, W, S1, S2, F, A>(
  A: Arbitrary<(r: R, sa: S1) => Kind<F, [[A, S2, W]]>>,
): Arbitrary<IxRWST<R, W, S1, S2, F, A>> => A;

export const fp4tsIxStateT = <F, S1, S2, A>(
  A: Arbitrary<(s: S1) => Kind<F, [[A, S2]]>>,
): Arbitrary<IxStateT<S1, S2, F, A>> => A;

export const fp4tsRWST = <R, W, S, F, A>(
  F: FlatMap<F>,
  A: Arbitrary<(r: R, s: S, w: W) => Kind<F, [[A, S, W]]>>,
): Arbitrary<RWST<R, W, S, F, A>> =>
  A.map(
    runRWS =>
      <R>(g: (a: A, s: S, w: W) => Kind<F, [R]>) =>
      (r, s, w) =>
        F.flatMap_(runRWS(r, s, w), ([a, s, w]) => g(a, s, w)),
  );

export const fp4tsStateT = <F, S, A>(
  F: FlatMap<F>,
  A: Arbitrary<(s: S) => Kind<F, [[A, S]]>>,
): Arbitrary<StateT<S, F, A>> =>
  A.map(
    runState =>
      <R>(g: (a: A) => (s: S) => Kind<F, [R]>) =>
      s =>
        F.flatMap_(runState(s), ([a, s]) => g(a)(s)),
  );

export const fp4tsState = <S, A>(
  arbS: Arbitrary<S>,
  arbA: Arbitrary<A>,
): Arbitrary<State<S, A>> =>
  fc.func<[S], [A, S]>(fc.tuple(arbA, arbS)).map(State);

export const fp4tsIxRWS = <R, W, S1, S2, A>(
  A: Arbitrary<(r: R, s: S1) => [A, S2, W]>,
): Arbitrary<IxRWS<R, W, S1, S2, A>> => A.map(IxRWS);

export const fp4tsRWS = <R, W, S, A>(
  A: Arbitrary<(r: R, s: S) => [A, S, W]>,
): Arbitrary<RWS<R, W, S, A>> => A.map(RWS);

export const fp4tsWriterT = <F, W, A>(
  arbFLV: Arbitrary<Kind<F, [[A, W]]>>,
): Arbitrary<WriterT<F, W, A>> => arbFLV.map(WriterT);

export const fp4tsWriter = <W, A>(
  arbFLV: Arbitrary<[W, A]>,
): Arbitrary<Writer<W, A>> => arbFLV.map(Writer);

export const fp4tsReader = <R, A>(
  arbA: Arbitrary<A>,
): Arbitrary<Reader<R, A>> => fc.func<[R], A>(arbA).map(Reader.lift);
