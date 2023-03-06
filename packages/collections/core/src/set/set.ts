// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, HKT, PrimitiveType, TyK, TyVar } from '@fp4ts/core';
import { Eq, Ord, Monoid, Foldable } from '@fp4ts/cats';

import { List } from '../list';

import { Set as SetBase } from './algebra';
import { empty, fromArray, fromList, pure } from './constructors';
import { setEq, setFoldable, setMonoid } from './instance';

export type Set<A> = SetBase<A>;

export const Set: SetObj = function <A extends PrimitiveType>(
  ...xs: A[]
): Set<A> {
  return fromArray(Ord.fromUniversalCompare(), xs);
} as any;

interface SetObj {
  <A extends PrimitiveType>(...xs: A[]): Set<A>;
  singleton<A>(a: A): Set<A>;
  fromArray<A extends PrimitiveType>(xs: A[]): Set<A>;
  fromArray<A>(O: Ord<A>, xs: A[]): Set<A>;
  fromList<A extends PrimitiveType>(xs: List<A>): Set<A>;
  fromList<A>(O: Ord<A>, xs: List<A>): Set<A>;

  empty: Set<never>;

  // -- Instances
  Eq<A>(O: Eq<A>): Eq<Set<A>>;
  Monoid<A>(O: Ord<A>): Monoid<Set<A>>;
  Foldable: Foldable<SetF>;
}

Set.singleton = pure;

Set.fromArray = function (O: any, xs?: any) {
  return xs !== undefined
    ? fromArray(O, xs)
    : fromArray(Ord.fromUniversalCompare(), O);
};
Set.fromList = function (O: any, xs?: any) {
  return xs !== undefined
    ? fromList(O, xs)
    : fromList(Ord.fromUniversalCompare(), O);
};

Set.empty = empty;

Set.Eq = setEq;
Set.Monoid = setMonoid;

Object.defineProperty(Set, 'Foldable', {
  get() {
    return setFoldable();
  },
});

// -- HKT

declare module './algebra' {
  export interface Set<A> extends HKT<SetF, [A]> {}
}

/**
 * @category Type Constructor
 * @category Collection
 */
export interface SetF extends TyK<[unknown]> {
  [$type]: Set<TyVar<this, 0>>;
}
