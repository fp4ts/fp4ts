// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either } from '../../either';
import { List } from '../list';
import { Vector } from '../vector';
import { Queue } from './algebra';
import { iterator } from './operators';

export const singleton = <A>(a: A): Queue<A> => new Queue(List.empty, List(a));
export const pure = singleton;

export const empty: Queue<never> = new Queue(List.empty, List.empty);

export const of = <A>(...as: A[]): Queue<A> => fromArray(as);

export const fromArray = <A>(as: A[]): Queue<A> =>
  new Queue(List.empty, List.fromArray(as));

export const fromList = <A>(as: List<A>): Queue<A> => new Queue(List.empty, as);

export const fromVector = <A>(as: Vector<A>): Queue<A> =>
  new Queue(List.empty, as.toList);

export const fromIterator = <A>(it: Iterator<A>): Queue<A> =>
  new Queue(List.empty, List.fromIterator(it));

export const tailRecM: <S>(
  s: S,
) => <A>(f: (a: S) => Queue<Either<S, A>>) => Queue<A> = s => f =>
  tailRecM_(s, f);

export const tailRecM_ = <S, A>(
  s: S,
  f: (a: S) => Queue<Either<S, A>>,
): Queue<A> => {
  const results: A[] = [];
  let stack = List(iterator(f(s)));

  while (stack.nonEmpty) {
    const [hd, tl] = stack.uncons.get;
    const next = hd.next();

    if (next.done) {
      stack = tl;
    } else if (next.value.isRight) {
      results.push(next.value.get);
    } else {
      stack = tl.prepend(hd).prepend(iterator(f(next.value.getLeft)));
    }
  }

  return fromArray(results);
};
