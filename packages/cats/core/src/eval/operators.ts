// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id } from '@fp4ts/core';
import { Either } from '../data';
import { Eval, FlatMap, Map, Now } from './algebra';
import { pure } from './constructors';

export const memoize: <A>(fa: Eval<A>) => Eval<A> = fa => fa.memoize;

export const value: <A>(fa: Eval<A>) => A = fa => fa.value;

export const map: <A, B>(f: (a: A) => B) => (fa: Eval<A>) => Eval<B> =
  f => fa =>
    map_(fa, f);

export const flatMap: <A, B>(
  f: (a: A) => Eval<B>,
) => (fa: Eval<A>) => Eval<B> = f => fa => flatMap_(fa, f);

export const flatten: <A>(ffa: Eval<Eval<A>>) => Eval<A> = flatMap(id);

export const tailRecM: <S>(
  s: S,
) => <A>(f: (s: S) => Eval<Either<S, A>>) => Eval<A> = s => f =>
  tailRecM_(s, f);

// -- Point-ful operators

export const map_ = <A, B>(fa: Eval<A>, f: (a: A) => B): Eval<B> =>
  new Map(fa, f);

export const flatMap_ = <A, B>(fa: Eval<A>, f: (a: A) => Eval<B>): Eval<B> =>
  new FlatMap(fa, f);

export const tailRecM_ = <S, A>(
  s: S,
  f: (s: S) => Eval<Either<S, A>>,
): Eval<A> =>
  flatMap_(f(s), ea =>
    ea.fold(
      s => tailRecM_(s, f),
      b => pure(b),
    ),
  );
