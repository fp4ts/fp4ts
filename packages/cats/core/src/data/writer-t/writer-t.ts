// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Fix, Kind, TyK, TyVar, α, β, λ } from '@fp4ts/core';
import { Semigroup, Monoid, Eq } from '@fp4ts/cats-kernel';
import { Functor } from '../../functor';
import { Contravariant } from '../../contravariant';
import { Bifunctor } from '../../bifunctor';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Applicative } from '../../applicative';
import { Monad } from '../../monad';
import { ApplicativeError } from '../../applicative-error';
import { MonadError } from '../../monad-error';
import { Identity, IdentityF } from '../identity';

import { WriterT as WriterTBase } from './algebra';
import { liftF, pure, tell, unit } from './constructors';
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
export type Writer<L, V> = WriterT<IdentityF, L, V>;

export const WriterT: WriterTObj = function (flv) {
  return new WriterTBase(flv);
};
WriterT.liftF = liftF;
WriterT.pure = pure;
WriterT.unit = unit;
WriterT.tell = tell;

interface WriterTObj {
  <F, L, V>(flv: Kind<F, [[L, V]]>): WriterT<F, L, V>;

  liftF<F, L>(
    F: Functor<F>,
    L: Monoid<L>,
  ): <V>(fv: Kind<F, [V]>) => WriterT<F, L, V>;
  pure<F, L>(F: Applicative<F>, L: Monoid<L>): <V>(v: V) => WriterT<F, L, V>;
  unit<F, L>(F: Applicative<F>, L: Monoid<L>): WriterT<F, L, void>;
  tell<F>(F: Applicative<F>): <L>(l: L) => WriterT<F, L, void>;

  // -- Instances

  Eq<F, L, V>(E: Eq<Kind<F, [[L, V]]>>): Eq<WriterT<F, L, V>>;
  Functor<F, L>(F: Functor<F>): Functor<$<WriterTF, [F, L]>>;
  Contravariant<F, L>(F: Contravariant<F>): Contravariant<$<WriterTF, [F, L]>>;
  Bifunctor<F>(F: Functor<F>): Bifunctor<$<WriterTF, [F]>>;
  Apply<F, L>(F: Apply<F>, L: Semigroup<L>): Apply<$<WriterTF, [F, L]>>;
  FlatMap<F, L>(F: FlatMap<F>, L: Monoid<L>): FlatMap<$<WriterTF, [F, L]>>;
  Applicative<F, L>(
    F: Applicative<F>,
    L: Monoid<L>,
  ): Applicative<$<WriterTF, [F, L]>>;
  Monad<F, L>(F: Monad<F>, L: Monoid<L>): Monad<$<WriterTF, [F, L]>>;
  ApplicativeError<F, L, E>(
    F: ApplicativeError<F, E>,
    L: Monoid<L>,
  ): ApplicativeError<$<WriterTF, [F, L]>, E>;
  MonadError<F, L, E>(
    F: MonadError<F, E>,
    L: Monoid<L>,
  ): MonadError<$<WriterTF, [F, L]>, E>;
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
Writer.unit = L => unit(Identity.Applicative, L);
Writer.tell = x => tell(Identity.Applicative)(x);

interface WriterObj {
  <L, V>(lv: [L, V]): Writer<L, V>;

  pure<L>(L: Monoid<L>): <V>(v: V) => Writer<L, V>;
  unit<L>(L: Monoid<L>): Writer<L, void>;
  tell<L>(l: L): Writer<L, void>;

  // -- Instances

  Eq<L, V>(E: Eq<[L, V]>): Eq<Writer<L, V>>;
  Functor<L>(): Functor<$<WriterTF, [IdentityF, L]>>;
  readonly Bifunctor: Bifunctor<$<WriterTF, [IdentityF]>>;
  Apply<L>(L: Semigroup<L>): Apply<$<WriterTF, [IdentityF, L]>>;
  FlatMap<L>(L: Monoid<L>): FlatMap<$<WriterTF, [IdentityF, L]>>;
  Applicative<L>(L: Monoid<L>): Applicative<$<WriterTF, [IdentityF, L]>>;
  Monad<L>(L: Monoid<L>): Monad<$<WriterTF, [IdentityF, L]>>;
}

Writer.Eq = writerTEq;
Writer.Functor = () => writerTFunctor(Identity.Functor);
Writer.Apply = L => writerTApply(Identity.Apply, L);
Writer.FlatMap = L => writerTFlatMap(Identity.FlatMap, L);
Writer.Applicative = L => writerTApplicative(Identity.Applicative, L);
Writer.Monad = L => writerTMonad(Identity.Monad, L);

Object.defineProperty(Writer, 'Bifunctor', {
  get(): Bifunctor<$<WriterTF, [IdentityF]>> {
    return writerTBifunctor(Identity.Functor);
  },
});

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface WriterTF extends TyK<[unknown, unknown, unknown]> {
  [$type]: WriterT<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}

/**
 * @category Type Constructor
 * @category Data
 */
export type WriterF = λ<WriterTF, [Fix<IdentityF>, α, β]>;
