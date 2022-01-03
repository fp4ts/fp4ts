// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, $type, TyK, TyVar } from '@fp4ts/core';
import { Foldable } from '../../../foldable';
import { Eq } from '../../../eq';
import { Align } from '../../../align';
import { MonoidK } from '../../../monoid-k';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { Applicative } from '../../../applicative';
import { Alternative } from '../../../alternative';
import { Monad } from '../../../monad';
import { Traversable } from '../../../traversable';
import { Either } from '../../either';
import { Vector } from '../vector';
import { List } from '../list';

import { Chain as ChainBase } from './algebra';
import {
  empty,
  fromArray,
  fromList,
  fromVector,
  of,
  pure,
  singleton,
  tailRecM,
} from './constructors';
import { traverseViaChain } from './operators';
import {
  chainAlign,
  chainAlternative,
  chainEq,
  chainFunctor,
  chainFunctorFilter,
  chainMonad,
  chainMonoidK,
  chainTraversable,
} from './instances';

/**
 * @category Collection
 */
export type Chain<A> = ChainBase<A>;
/**
 * @category Collection
 */
export const Chain: ChainObj = function (...xs: any[]) {
  return fromArray(xs);
} as any;

interface ChainObj {
  <A>(...xs: A[]): Chain<A>;
  pure<A>(x: A): Chain<A>;
  singleton<A>(x: A): Chain<A>;
  empty: Chain<never>;
  of<A>(...xs: A[]): Chain<A>;
  fromArray<A>(xs: A[]): Chain<A>;
  fromList<A>(xs: List<A>): Chain<A>;
  fromVector<A>(xs: Vector<A>): Chain<A>;
  traverseViaChain<G, F>(
    G: Applicative<G>,
    F: Foldable<F>,
  ): <A, B>(xs: Kind<F, [A]>, f: (a: A) => Kind<G, [B]>) => Kind<G, [Chain<B>]>;
  tailRecM<S>(s: S): <A>(f: (s: S) => Chain<Either<S, A>>) => Chain<A>;

  // -- Instances
  Eq<A>(E: Eq<A>): Eq<Chain<A>>;
  readonly Align: Align<ChainK>;
  readonly MonoidK: MonoidK<ChainK>;
  readonly Functor: Functor<ChainK>;
  readonly FunctorFilter: FunctorFilter<ChainK>;
  readonly Alternative: Alternative<ChainK>;
  readonly Monad: Monad<ChainK>;
  readonly Traversable: Traversable<ChainK>;
}

Chain.pure = pure;
Chain.singleton = singleton;
Chain.empty = empty;
Chain.of = of;
Chain.fromArray = fromArray;
Chain.fromList = fromList;
Chain.fromVector = fromVector;
Chain.traverseViaChain = traverseViaChain;
Chain.tailRecM = tailRecM;

Chain.Eq = chainEq;
Object.defineProperty(Chain, 'Align', {
  get() {
    return chainAlign();
  },
});
Object.defineProperty(Chain, 'MonoidK', {
  get() {
    return chainMonoidK();
  },
});
Object.defineProperty(Chain, 'Functor', {
  get() {
    return chainFunctor();
  },
});
Object.defineProperty(Chain, 'FunctorFilter', {
  get() {
    return chainFunctorFilter();
  },
});
Object.defineProperty(Chain, 'Alternative', {
  get() {
    return chainAlternative();
  },
});
Object.defineProperty(Chain, 'Monad', {
  get() {
    return chainMonad();
  },
});
Object.defineProperty(Chain, 'Traversable', {
  get() {
    return chainTraversable();
  },
});

// HKT

/**
 * @category Type Constructor
 * @category Collection
 */
export interface ChainK extends TyK<[unknown]> {
  [$type]: Chain<TyVar<this, 0>>;
}
