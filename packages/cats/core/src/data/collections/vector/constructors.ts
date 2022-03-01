// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either } from '../../either';
import { List } from '../list';

import { Vector, Vector0, Vector1 } from './algebra';
import { WIDTH } from './constants';
import { iterator } from './operators';
import { VectorBuilder } from './vector-builder';

export const pure = <A>(x: A): Vector<A> => new Vector1([x]);

export const fromArray = <A>(xs: A[]): Vector<A> =>
  xs.length === 0
    ? Vector0
    : xs.length < WIDTH
    ? new Vector1(xs)
    : xs.reduce((b, x) => b.addOne(x), new VectorBuilder<A>()).toVector;

export const fromList = <A>(xs: List<A>): Vector<A> =>
  fromIterator(xs.iterator);

export const fromIterator = <A>(iter: Iterator<A>): Vector<A> =>
  new VectorBuilder<A>().addIterator(iter).toVector;

export const tailRecM_ = <S, A>(
  s: S,
  f: (s: S) => Vector<Either<S, A>>,
): Vector<A> => {
  const buf = new VectorBuilder<A>();
  let stack = List(iterator(f(s)));

  while (stack.nonEmpty) {
    const [hd, tl] = stack.uncons.get;
    const next = hd.next();

    if (next.done) {
      stack = tl;
    } else if (next.value.isRight) {
      buf.addOne(next.value.get);
    } else {
      stack = tl.prepend(hd).prepend(iterator(f(next.value.getLeft)));
    }
  }

  return buf.toVector;
};
