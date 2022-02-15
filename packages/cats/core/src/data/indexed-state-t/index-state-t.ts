// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, Fix, Kind, TyK, TyVar, α, β, γ, λ, $ } from '@fp4ts/core';
import { Applicative } from '../../applicative';
import { Functor } from '../../functor';
import { Bifunctor } from '../../bifunctor';
import { Profunctor, Strong } from '../../arrow';
import { Contravariant } from '../../contravariant';
import { Monad } from '../../monad';
import { MonadError } from '../../monad-error';
import { Eval, EvalF } from '../../eval';

import { AndThen } from '../and-then';
import { IndexedStateT as IndexedStateTBase } from './algebra';
import {
  get,
  inspect,
  inspectF,
  lift,
  liftF,
  modify,
  modifyF,
  pure,
  set,
  setF,
  StateFunctions,
  StateTFunctions,
} from './constructors';
import {
  indexedStateTBifunctor,
  indexedStateTContravariant,
  indexedStateTFunctor,
  indexedStateTMonad,
  indexedStateTMonadError,
  indexedStateTProfunctor,
  indexedStateTStrong,
} from './instances';

export type IndexedStateT<F, SA, SB, A> = IndexedStateTBase<F, SA, SB, A>;
export const IndexedStateT: IndexedStateTObj = function <F, SA, SB, A>(
  fsafsba: Kind<F, [(sa: SA) => Kind<F, [[SB, A]]>]>,
): IndexedStateT<F, SA, SB, A> {
  return new IndexedStateTBase(fsafsba);
};
IndexedStateT.pure = pure;
IndexedStateT.lift = lift;
IndexedStateT.liftF = liftF;
IndexedStateT.modify = modify;
IndexedStateT.modifyF = modifyF;
IndexedStateT.inspect = inspect;
IndexedStateT.inspectF = inspectF;
IndexedStateT.set = set;
IndexedStateT.setF = setF;
IndexedStateT.get = get;

IndexedStateT.Functor = F => indexedStateTFunctor(F);
IndexedStateT.Contravariant = F => indexedStateTContravariant(F);
IndexedStateT.Bifunctor = F => indexedStateTBifunctor(F);
IndexedStateT.Profunctor = F => indexedStateTProfunctor(F);
IndexedStateT.Strong = F => indexedStateTStrong(F);
IndexedStateT.Monad = F => indexedStateTMonad(F);
IndexedStateT.MonadError = F => indexedStateTMonadError(F);

interface IndexedStateTObj {
  <F, SA, SB, A>(
    fsafsba: Kind<F, [(sa: SA) => Kind<F, [[SB, A]]>]>,
  ): IndexedStateT<F, SA, SB, A>;
  pure<F>(F: Applicative<F>): <S, A>(a: A) => IndexedStateT<F, S, S, A>;
  lift<F>(
    F: Applicative<F>,
  ): <SA, SB, A>(
    f: (sa: SA) => Kind<F, [[SB, A]]>,
  ) => IndexedStateT<F, SA, SB, A>;
  liftF<F>(
    F: Applicative<F>,
  ): <S, A>(fa: Kind<F, [A]>) => IndexedStateT<F, S, S, A>;
  modify<F>(
    F: Applicative<F>,
  ): <SA, SB>(f: (sa: SA) => SB) => IndexedStateT<F, SA, SB, void>;
  modifyF<F>(
    F: Applicative<F>,
  ): <SA, SB>(f: (sa: SA) => Kind<F, [SB]>) => IndexedStateT<F, SA, SB, void>;
  inspect<F>(
    F: Applicative<F>,
  ): <S, A>(f: (s: S) => A) => IndexedStateT<F, S, S, A>;
  inspectF<F>(
    F: Applicative<F>,
  ): <S, A>(f: (s: S) => Kind<F, [A]>) => IndexedStateT<F, S, S, A>;
  set<F>(F: Applicative<F>): <SA, SB>(sb: SB) => IndexedStateT<F, SA, SB, void>;
  setF<F>(
    F: Applicative<F>,
  ): <SA, SB>(sb: Kind<F, [SB]>) => IndexedStateT<F, SA, SB, void>;
  get<F, S>(F: Applicative<F>): StateT<F, S, S>;

  // -- Instances

  Functor<F, SA, SB>(F: Functor<F>): Functor<$<IndexedStateTF, [F, SA, SB]>>;
  Contravariant<F, SB, A>(
    F: Functor<F>,
  ): Contravariant<λ<IndexedStateTF, [Fix<F>, α, Fix<SB>, Fix<A>]>>;
  Bifunctor<F, SA>(F: Functor<F>): Bifunctor<$<IndexedStateTF, [F, SA]>>;
  Profunctor<F, V>(
    F: Functor<F>,
  ): Profunctor<λ<IndexedStateTF, [Fix<F>, α, β, Fix<V>]>>;
  Strong<F, V>(F: Monad<F>): Strong<λ<IndexedStateTF, [Fix<F>, α, β, Fix<V>]>>;
  Monad<F, S>(F: Monad<F>): Monad<$<IndexedStateTF, [F, S, S]>>;
  MonadError<F, S, E>(
    F: MonadError<F, E>,
  ): MonadError<$<IndexedStateTF, [F, S, S]>, E>;
}

export type StateT<F, S, A> = IndexedStateT<F, S, S, A>;
export const StateT: StateTObj = function <F>(F: Applicative<F>) {
  return <S, A>(f: (s: S) => Kind<F, [[S, A]]>): StateT<F, S, A> =>
    IndexedStateT(F.pure(f));
};
StateT.pure = StateTFunctions.pure;
StateT.liftF = StateTFunctions.liftF;
StateT.modify = StateTFunctions.modify;
StateT.modifyF = StateTFunctions.modifyF;
StateT.inspect = StateTFunctions.inspect;
StateT.inspectF = StateTFunctions.inspectF;
StateT.set = StateTFunctions.set;
StateT.setF = StateTFunctions.setF;
StateT.get = StateTFunctions.get;
StateT.Monad = F => indexedStateTMonad(F);
StateT.MonadError = F => indexedStateTMonadError(F);

interface StateTObj {
  <F>(F: Applicative<F>): <S, A>(
    f: (s: S) => Kind<F, [[S, A]]>,
  ) => StateT<F, S, A>;
  pure<F>(F: Applicative<F>): <S, A>(a: A) => IndexedStateT<F, S, S, A>;
  liftF<F>(
    F: Applicative<F>,
  ): <S, A>(fa: Kind<F, [A]>) => IndexedStateT<F, S, S, A>;
  modify<F>(F: Applicative<F>): <S>(f: (sa: S) => S) => StateT<F, S, void>;
  modifyF<F>(
    F: Applicative<F>,
  ): <S>(f: (sa: S) => Kind<F, [S]>) => StateT<F, S, void>;
  inspect<F>(
    F: Applicative<F>,
  ): <S, A>(f: (s: S) => A) => IndexedStateT<F, S, S, A>;
  inspectF<F>(
    F: Applicative<F>,
  ): <S, A>(f: (s: S) => Kind<F, [A]>) => IndexedStateT<F, S, S, A>;
  set<F>(F: Applicative<F>): <S>(sb: S) => StateT<F, S, void>;
  setF<F>(F: Applicative<F>): <S>(sb: Kind<F, [S]>) => StateT<F, S, void>;
  get<F, S>(F: Applicative<F>): StateT<F, S, S>;

  Monad<F, S>(F: Monad<F>): Monad<$<StateTF, [F, S, S]>>;
  MonadError<F, S, E>(
    F: MonadError<F, E>,
  ): MonadError<$<StateTF, [F, S, S]>, E>;
}

export type State<S, A> = StateT<EvalF, S, A>;
export const State: StateObj = function <S, A>(
  f: (s: S) => [S, A],
): State<S, A> {
  return IndexedStateT(Eval.now(AndThen(f).andThen(Eval.now)));
};
State.pure = StateFunctions.pure;
State.modify = StateFunctions.modify;
State.inspect = StateFunctions.inspect;
State.set = StateFunctions.set;
State.get = StateFunctions.get;
State.Monad = () => indexedStateTMonad(Eval.Monad);

interface StateObj {
  <S, A>(f: (s: S) => [S, A]): State<S, A>;
  pure<S, A>(a: A): IndexedStateT<EvalF, S, S, A>;
  inspect<S, A>(f: (s: S) => A): IndexedStateT<EvalF, S, S, A>;
  modify<S>(f: (sa: S) => S): IndexedStateT<EvalF, S, S, void>;
  set<S>(sb: S): IndexedStateT<EvalF, S, S, void>;
  get<S>(): IndexedStateT<EvalF, S, S, S>;

  Monad<S>(): Monad<$<IndexedStateTF, [EvalF, S, S]>>;
}

// -- HKT

export interface IndexedStateTF extends TyK {
  [$type]: IndexedStateT<
    TyVar<this, 0>,
    TyVar<this, 1>,
    TyVar<this, 2>,
    TyVar<this, 3>
  >;
}

export type StateTF = λ<IndexedStateTF, [α, β, β, γ]>;

export type StateF = λ<IndexedStateTF, [Fix<EvalF>, α, α, β]>;
