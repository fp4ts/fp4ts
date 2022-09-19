// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  CoflatMap,
  Comonad,
  Eval,
  Foldable,
  Functor,
  Traversable,
} from '@fp4ts/cats-core';
import { $, $type, HKT, Kind, TyK, TyVar } from '@fp4ts/core';

import { Cofree as CofreeBase } from './algebra';
import { ana, anaEval, unfold, unfoldEval } from './constructors';
import {
  cofreeCoflatMap,
  cofreeComonad,
  cofreeFoldable,
  cofreeFunctor,
  cofreeTraversable,
} from './instances';

export type Cofree<S, A> = CofreeBase<S, A>;

export const Cofree: CofreeObj = function <S, A>(
  head: A,
  tail: Eval<Kind<S, [Cofree<S, A>]>>,
) {
  return new CofreeBase(head, tail);
};

interface CofreeObj {
  <S, A>(head: A, tail: Eval<Kind<S, [Cofree<S, A>]>>): Cofree<S, A>;

  unfold<F>(
    F: Functor<F>,
  ): <A>(a: A) => (f: (a: A) => Kind<F, [A]>) => Cofree<F, A>;

  unfoldEval<F>(
    F: Functor<F>,
  ): <A>(a: A) => (f: (a: A) => Eval<Kind<F, [A]>>) => Cofree<F, A>;

  ana<F>(
    F: Functor<F>,
  ): <A>(
    a: A,
  ) => <B>(coalg: (a: A) => Kind<F, [A]>, f: (a: A) => B) => Cofree<F, B>;

  anaEval<F>(
    F: Functor<F>,
  ): <A>(
    a: A,
  ) => <B>(coalg: (a: A) => Eval<Kind<F, [A]>>, f: (a: A) => B) => Cofree<F, B>;

  // -- Instances

  Functor<S>(S: Functor<S>): Functor<$<CofreeF, [S]>>;
  CoflatMap<S>(S: Functor<S>): CoflatMap<$<CofreeF, [S]>>;
  Comonad<S>(S: Functor<S>): Comonad<$<CofreeF, [S]>>;
  Foldable<S>(S: Foldable<S>): Foldable<$<CofreeF, [S]>>;
  Traversable<S>(S: Traversable<S>): Traversable<$<CofreeF, [S]>>;
}

Cofree.unfold = unfold;
Cofree.unfoldEval = unfoldEval;
Cofree.ana = ana;
Cofree.anaEval = anaEval;

Cofree.Functor = cofreeFunctor;
Cofree.CoflatMap = cofreeCoflatMap;
Cofree.Comonad = cofreeComonad;
Cofree.Foldable = cofreeFoldable;
Cofree.Traversable = cofreeTraversable;

// -- HKT

declare module './algebra' {
  export interface Cofree<S, A> extends HKT<CofreeF, [S, A]> {}
}

export interface CofreeF extends TyK<[unknown, unknown]> {
  [$type]: Cofree<TyVar<this, 0>, TyVar<this, 1>>;
}
