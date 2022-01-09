// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Fix, Kind, TyK, TyVar, α, β, λ } from '@fp4ts/core';
import { Functor } from '../../functor';
import { Contravariant } from '../../contravariant';
import { Bifunctor } from '../../bifunctor';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Applicative } from '../../applicative';
import { Monad } from '../../monad';
import { ApplicativeError } from '../../applicative-error';
import { MonadError } from '../../monad-error';
import { Semigroup } from '../../semigroup';
import { Monoid } from '../../monoid';
import { Eq } from '../../eq';
import { Identity, IdentityK } from '../identity';

import { WriterT as WriterTBase } from './algebra';
import { liftF, pure } from './constructors';
import {
  writerTApplicative,
  writerTApplicativeError,
  writerTApply,
  writerTBifunctor,
  writerTContravariant,
  writerTEq,
  writerTFlatMap,
  writerTFunctor,
  writerTMonad,
  writerTMonadError,
} from './instances';

export type WriterT<F, L, V> = WriterTBase<F, L, V>;
export type Writer<L, V> = WriterT<IdentityK, L, V>;

export const WriterT: WriterTObj = function (flv) {
  return new WriterTBase(flv);
};
WriterT.liftF = liftF;
WriterT.pure = pure;

interface WriterTObj {
  <F, L, V>(flv: Kind<F, [[L, V]]>): WriterT<F, L, V>;

  liftF<F, L>(
    F: Functor<F>,
    L: Monoid<L>,
  ): <V>(fv: Kind<F, [V]>) => WriterT<F, L, V>;
  pure<F, L>(F: Applicative<F>, L: Monoid<L>): <V>(v: V) => WriterT<F, L, V>;

  // -- Instances

  Eq<F, L, V>(E: Eq<Kind<F, [[L, V]]>>): Eq<WriterT<F, L, V>>;
  Functor<F, L>(F: Functor<F>): Functor<$<WriterTK, [F, L]>>;
  Contravariant<F, L>(F: Contravariant<F>): Contravariant<$<WriterTK, [F, L]>>;
  Bifunctor<F>(F: Functor<F>): Bifunctor<$<WriterTK, [F]>>;
  Apply<F, L>(F: Apply<F>, L: Semigroup<L>): Apply<$<WriterTK, [F, L]>>;
  FlatMap<F, L>(F: FlatMap<F>, L: Monoid<L>): FlatMap<$<WriterTK, [F, L]>>;
  Applicative<F, L>(
    F: Applicative<F>,
    L: Monoid<L>,
  ): Applicative<$<WriterTK, [F, L]>>;
  Monad<F, L>(F: Monad<F>, L: Monoid<L>): Monad<$<WriterTK, [F, L]>>;
  ApplicativeError<F, L, E>(
    F: ApplicativeError<F, E>,
    L: Monoid<L>,
  ): ApplicativeError<$<WriterTK, [F, L]>, E>;
  MonadError<F, L, E>(
    F: MonadError<F, E>,
    L: Monoid<L>,
  ): MonadError<$<WriterTK, [F, L]>, E>;
}

WriterT.Eq = writerTEq;
WriterT.Functor = writerTFunctor;
WriterT.Contravariant = writerTContravariant;
WriterT.Apply = writerTApply;
WriterT.Bifunctor = writerTBifunctor;
WriterT.FlatMap = writerTFlatMap;
WriterT.Applicative = writerTApplicative;
WriterT.Monad = writerTMonad;
WriterT.ApplicativeError = writerTApplicativeError;
WriterT.MonadError = writerTMonadError;

export const Writer: WriterObj = function <L, V>(lv: [L, V]): Writer<L, V> {
  return new WriterTBase(lv);
} as any;
Writer.pure = L => v => pure(Identity.Applicative, L)(v);

interface WriterObj {
  <L, V>(lv: [L, V]): Writer<L, V>;

  pure<L>(L: Monoid<L>): <V>(v: V) => Writer<L, V>;

  // -- Instances

  Eq<L, V>(E: Eq<[L, V]>): Eq<Writer<L, V>>;
  Functor<L>(): Functor<$<WriterTK, [IdentityK, L]>>;
  readonly Bifunctor: Bifunctor<$<WriterTK, [IdentityK]>>;
  Apply<L>(L: Semigroup<L>): Apply<$<WriterTK, [IdentityK, L]>>;
  FlatMap<L>(L: Monoid<L>): FlatMap<$<WriterTK, [IdentityK, L]>>;
  Applicative<L>(L: Monoid<L>): Applicative<$<WriterTK, [IdentityK, L]>>;
  Monad<L>(L: Monoid<L>): Monad<$<WriterTK, [IdentityK, L]>>;
}

Writer.Eq = writerTEq;
Writer.Functor = () => writerTFunctor(Identity.Functor);
Writer.Apply = L => writerTApply(Identity.Apply, L);
Writer.FlatMap = L => writerTFlatMap(Identity.FlatMap, L);
Writer.Applicative = L => writerTApplicative(Identity.Applicative, L);
Writer.Monad = L => writerTMonad(Identity.Monad, L);

Object.defineProperty(Writer, 'Bifunctor', {
  get(): Bifunctor<$<WriterTK, [IdentityK]>> {
    return writerTBifunctor(Identity.Functor);
  },
});

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface WriterTK extends TyK<[unknown, unknown, unknown]> {
  [$type]: WriterT<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}

/**
 * @category Type Constructor
 * @category Data
 */
export type WriterK = λ<WriterTK, [Fix<IdentityK>, α, β]>;
