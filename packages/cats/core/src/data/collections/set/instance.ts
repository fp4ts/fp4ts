// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy, lazyVal } from '@fp4ts/core';
import { Eq, Monoid, Ord } from '@fp4ts/cats-kernel';
import { Foldable } from '../../../foldable';

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
  foldRight_,
  toList,
  toVector,
  foldMapK_,
} from './operators';

import type { Set, SetF } from './set';

export const setEq: <A>(E: Eq<A>) => Eq<Set<A>> = <A>(E: Eq<A>): Eq<Set<A>> =>
  Eq.of({ equals: equals_(E) });

export const setMonoid: <A>(O: Ord<A>) => Monoid<Set<A>> = <A>(O: Ord<A>) =>
  Monoid.of({
    empty: empty as Set<A>,
    combine_: (x, y) => union_(O, x, y()),
  });

export const setFoldable: Lazy<Foldable<SetF>> = lazyVal(() =>
  Foldable.of({
    foldLeft_: foldLeft_,
    foldRight_: foldRight_,
    foldMap_: foldMap_,
    foldMapK_: foldMapK_,
    all_: all_,
    any_: any_,
    count_: count_,
    iterator: iterator,
    isEmpty: isEmpty,
    nonEmpty: nonEmpty,
    size: size,
    toList: toList,
    toVector: toVector,
  }),
);
