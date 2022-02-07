// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy, lazyVal } from '@fp4ts/core';
import { Eq, Monoid, Ord } from '@fp4ts/cats-kernel';
import { Foldable } from '../../../foldable';
import { Eval } from '../../../eval';

import { empty } from './constructors';
import {
  all_,
  any_,
  count_,
  equals_,
  foldMap_,
  isEmpty,
  iterator,
  nonEmpty,
  union_,
  size,
  foldLeft_,
  popMin,
} from './operators';

import type { Set, SetK } from './set';

export const setEq: <A>(E: Eq<A>) => Eq<Set<A>> = <A>(E: Eq<A>): Eq<Set<A>> =>
  Eq.of({ equals: equals_(E) });

export const setMonoid: <A>(O: Ord<A>) => Monoid<Set<A>> = <A>(O: Ord<A>) =>
  Monoid.of({
    empty: empty as Set<A>,
    combine_: (x, y) => union_(O, x, y()),
  });

export const setFoldable: Lazy<Foldable<SetK>> = lazyVal(() =>
  Foldable.of({
    foldLeft_: foldLeft_,
    foldRight_: <A, B>(
      sa: Set<A>,
      z: Eval<B>,
      f: (x: A, eb: Eval<B>) => Eval<B>,
    ): Eval<B> => {
      const loop = (sa: Set<A>): Eval<B> =>
        popMin(sa).fold(
          () => z,
          ([hd, tl]) =>
            f(
              hd,
              Eval.defer(() => loop(tl)),
            ),
        );
      return loop(sa);
    },
    foldMap_: foldMap_,
    all_: all_,
    any_: any_,
    count_: count_,
    iterator: iterator,
    isEmpty: isEmpty,
    nonEmpty: nonEmpty,
    size: size,
  }),
);
