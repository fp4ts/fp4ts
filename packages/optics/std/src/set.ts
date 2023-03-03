// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Ord, Set } from '@fp4ts/cats';
import {
  Fold,
  foldMap,
  IndexPreservingPSetter,
  IndexPreservingSetter,
  sets,
} from '@fp4ts/optics-core';

export function setmapped<A, B>(
  O?: Ord<B>,
): IndexPreservingPSetter<Set<A>, Set<B>, A, B>;
export function setmapped<A>(O?: Ord<A>): IndexPreservingSetter<Set<A>, A>;
export function setmapped<A>(
  O: Ord<A> = Ord.fromUniversalCompare(),
): IndexPreservingSetter<Set<A>, A> {
  return sets(f => s => s.map(f, O));
}

export function toSet<A>(
  O: Ord<A> = Ord.fromUniversalCompare(),
): <S>(l: Fold<S, A>) => (s: S) => Set<A> {
  return <S>(l: Fold<S, A>) => foldMap(l)(Set.Monoid(O))(Set.singleton);
}
