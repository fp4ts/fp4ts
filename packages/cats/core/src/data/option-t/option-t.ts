// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { Eq } from '../../eq';
import { Defer } from '../../defer';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Functor } from '../../functor';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Alternative } from '../../alternative';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';
import { MonadError } from '../../monad-error';

import { Option } from '../option';
import { Either } from '../either';

import { OptionT as OptionTBase } from './algebra';
import {
  fromNullable,
  fromOption,
  liftF,
  none,
  pure,
  some,
} from './constructors';
import { tailRecM } from './operators';
import {
  optionTAlternative,
  optionTApplicative,
  optionTApply,
  optionTDefer,
  optionTEq,
  optionTFlatMap,
  optionTFunctor,
  optionTMonad,
  optionTMonadError,
  optionTMonoidK,
  optionTSemigroupK,
} from './instances';

export type OptionT<F, A> = OptionTBase<F, A>;

export const OptionT: OptionTObj = function <F, A>(fa: Kind<F, [A]>) {
  return new OptionTBase(fa);
};

export const SomeF = some;
export const NoneF = none;

interface OptionTObj {
  <F, A>(fa: Kind<F, [Option<A>]>): OptionT<F, A>;
  pure: <F>(F: Applicative<F>) => <A>(a: A) => OptionT<F, A>;
  some: <F>(F: Applicative<F>) => <A>(a: A) => OptionT<F, A>;
  none: <F>(F: Applicative<F>) => OptionT<F, never>;
  liftF: <F>(F: Applicative<F>) => <A>(a: Kind<F, [A]>) => OptionT<F, A>;
  fromOption: <F>(F: Applicative<F>) => <A>(a: Option<A>) => OptionT<F, A>;
  fromNullable: <F>(
    F: Applicative<F>,
  ) => <A>(x: A | null | undefined) => OptionT<F, A>;

  tailRecM: <F>(
    F: Monad<F>,
  ) => <A>(a: A) => <B>(f: (a: A) => OptionT<F, Either<A, B>>) => OptionT<F, B>;

  // -- Instances

  Eq<F, A>(EF: Eq<Kind<F, [Option<A>]>>): Eq<OptionT<F, A>>;
  Defer<F>(F: Defer<F>): Defer<$<OptionTK, [F]>>;
  SemigroupK<F>(F: Monad<F>): SemigroupK<$<OptionTK, [F]>>;
  MonoidK<F>(F: Monad<F>): MonoidK<$<OptionTK, [F]>>;
  Functor<F>(F: Functor<F>): Functor<$<OptionTK, [F]>>;
  Apply<F>(F: Monad<F>): Apply<$<OptionTK, [F]>>;
  Applicative<F>(F: Monad<F>): Applicative<$<OptionTK, [F]>>;
  Alternative<F>(F: Monad<F>): Alternative<$<OptionTK, [F]>>;
  FlatMap<F>(F: Monad<F>): FlatMap<$<OptionTK, [F]>>;
  Monad<F>(F: Monad<F>): Monad<$<OptionTK, [F]>>;
  MonadError<F, E>(F: MonadError<F, E>): MonadError<$<OptionTK, [F]>, E>;
}

OptionT.pure = pure;
OptionT.some = some;
OptionT.none = none;
OptionT.liftF = liftF;
OptionT.fromOption = fromOption;
OptionT.fromNullable = fromNullable;
OptionT.tailRecM = tailRecM;

OptionT.Eq = optionTEq;
OptionT.Defer = optionTDefer;
OptionT.SemigroupK = optionTSemigroupK;
OptionT.MonoidK = optionTMonoidK;
OptionT.Functor = optionTFunctor;
OptionT.Apply = optionTApply;
OptionT.Applicative = optionTApplicative;
OptionT.Alternative = optionTAlternative;
OptionT.FlatMap = optionTFlatMap;
OptionT.Monad = optionTMonad;
OptionT.MonadError = optionTMonadError;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface OptionTK extends TyK<[unknown, unknown]> {
  [$type]: OptionT<TyVar<this, 0>, TyVar<this, 1>>;
}
