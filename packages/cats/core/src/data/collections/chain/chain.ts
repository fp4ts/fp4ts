// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, $type, TyK, TyVar, HKT } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Foldable } from '../../../foldable';
import { Align } from '../../../align';
import { MonoidK } from '../../../monoid-k';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { Applicative } from '../../../applicative';
import { Alternative } from '../../../alternative';
import { CoflatMap } from '../../../coflat-map';
import { Monad } from '../../../monad';
import { Either } from '../../either';
import { Option } from '../../option';
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
import { traverseFilterViaChain, traverseViaChain } from './operators';
import {
  chainAlign,
  chainAlternative,
  chainCoflatMap,
  chainEq,
  chainFunctor,
  chainFunctorFilter,
  chainMonad,
  chainMonoidK,
  chainTraversable,
} from './instances';
import { TraversableFilter } from '../../../traversable-filter';

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
  ): <A, B>(
    xs: Kind<F, [A]>,
    f: (a: A, i: number) => Kind<G, [B]>,
  ) => Kind<G, [Chain<B>]>;
  traverseFilterViaChain<G, F>(
    G: Applicative<G>,
    F: Foldable<F>,
  ): <A, B>(
    xs: Kind<F, [A]>,
    f: (a: A, i: number) => Kind<G, [Option<B>]>,
  ) => Kind<G, [Chain<B>]>;
  tailRecM<S>(s: S): <A>(f: (s: S) => Chain<Either<S, A>>) => Chain<A>;

  // -- Instances
  Eq<A>(E: Eq<A>): Eq<Chain<A>>;
  readonly Align: Align<ChainF>;
  readonly MonoidK: MonoidK<ChainF>;
  readonly Functor: Functor<ChainF>;
  readonly FunctorFilter: FunctorFilter<ChainF>;
  readonly Alternative: Alternative<ChainF>;
  readonly CoflatMap: CoflatMap<ChainF>;
  readonly Monad: Monad<ChainF>;
  readonly TraversableFilter: TraversableFilter<ChainF>;
}

Chain.pure = pure;
Chain.singleton = singleton;
Chain.empty = empty;
Chain.of = of;
Chain.fromArray = fromArray;
Chain.fromList = fromList;
Chain.fromVector = fromVector;
Chain.traverseViaChain = traverseViaChain;
Chain.traverseFilterViaChain = traverseFilterViaChain;
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
Object.defineProperty(Chain, 'CoflatMap', {
  get() {
    return chainCoflatMap();
  },
});
Object.defineProperty(Chain, 'Monad', {
  get() {
    return chainMonad();
  },
});
Object.defineProperty(Chain, 'TraversableFilter', {
  get() {
    return chainTraversable();
  },
});

// HKT

declare module './algebra' {
  export interface Chain<A> extends HKT<ChainF, [A]> {}
}

/**
 * @category Type Constructor
 * @category Collection
 */
export interface ChainF extends TyK<[unknown]> {
  [$type]: Chain<TyVar<this, 0>>;
}
