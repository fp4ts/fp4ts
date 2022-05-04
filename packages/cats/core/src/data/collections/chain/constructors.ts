// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '../array/array';
import { Kind } from '@fp4ts/core';
import { Foldable } from '../../../foldable';
import { Either } from '../../either';
import { Vector } from '../vector';
import { List } from '../list';
import { Array } from '../array';

import { Chain, Empty, Singleton, Wrap } from './algebra';

export const pure = <A>(a: A): Chain<A> => new Singleton(a);
export const singleton = pure;

export const empty: Chain<never> = Empty;

export const of = <A>(...xs: A[]): Chain<A> => fromArray(xs);

export const fromArray: <A>(xs: A[]) => Chain<A> = xs =>
  fromFoldable(Array.FoldableWithIndex())(xs);

export const fromList: <A>(xs: List<A>) => Chain<A> = xs =>
  fromFoldable(List.Foldable)(xs);

export const fromVector: <A>(xs: Vector<A>) => Chain<A> = xs =>
  fromFoldable(Vector.Foldable)(xs);

export const fromFoldable =
  <F>(F: Foldable<F>) =>
  <A>(fa: Kind<F, [A]>): Chain<A> =>
    F.nonEmpty(fa) ? new Wrap(F, fa) : Empty;

export const tailRecM: <S>(
  s: S,
) => <A>(f: (s: S) => Chain<Either<S, A>>) => Chain<A> = s => f =>
  tailRecM_(s, f);

export const tailRecM_ = <S, A>(
  s: S,
  f: (s: S) => Chain<Either<S, A>>,
): Chain<A> => {
  const results: A[] = [];
  let stack = List(f(s).iterator);

  while (stack.nonEmpty) {
    const [hd, tl] = stack.uncons.get;
    const next = hd.next();

    if (next.done) {
      stack = tl;
    } else if (next.value.isRight) {
      results.push(next.value.get);
    } else {
      stack = tl.prepend(hd).prepend(f(next.value.getLeft).iterator);
    }
  }

  return fromArray(results);
};
