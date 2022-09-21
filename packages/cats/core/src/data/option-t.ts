// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '@fp4ts/cats-kernel';
import { $, $type, cached, Kind, Lazy, TyK, TyVar } from '@fp4ts/core';
import { Alternative } from '../alternative';
import { Applicative } from '../applicative';
import { ApplicativeError } from '../applicative-error';
import { Apply } from '../apply';
import { Defer } from '../defer';
import { EqK } from '../eq-k';
import { Eval } from '../eval';
import { Functor } from '../functor';
import { Monad } from '../monad';
import { MonadError } from '../monad-error';

import { Either, Right } from './either';
import { None, Option, Some } from './option';

export type OptionT<F, A> = Kind<F, [Option<A>]>;
export const OptionT = function <F, A>(
  fa: Kind<F, [Option<A>]>,
): OptionT<F, A> {
  return fa;
};

OptionT.Some =
  <F>(F: Applicative<F>) =>
  <A>(a: A): OptionT<F, A> =>
    F.pure(Some(a));

OptionT.fromNullable =
  <F>(F: Applicative<F>) =>
  <A>(a: A | null | undefined): OptionT<F, A> =>
    F.pure(Option(a));

OptionT.None = <F>(F: Applicative<F>): OptionT<F, never> => F.pure(None);

OptionT.liftF =
  <F>(F: Functor<F>) =>
  <A>(fa: Kind<F, [A]>): OptionT<F, A> =>
    F.map_(fa, Some);

OptionT.isEmpty =
  <F>(F: Functor<F>) =>
  <A>(fa: OptionT<F, A>): Kind<F, [boolean]> =>
    F.map_(fa, opt => opt.isEmpty);
OptionT.nonEmpty =
  <F>(F: Functor<F>) =>
  <A>(fa: OptionT<F, A>): Kind<F, [boolean]> =>
    F.map_(fa, opt => opt.nonEmpty);

OptionT.getOrElse =
  <F>(F: Functor<F>) =>
  <A>(defaultValue: Lazy<A>) =>
  (fa: OptionT<F, A>): Kind<F, [A]> =>
    F.map_(fa, opt => opt.getOrElse(defaultValue));

OptionT.getOrElseF =
  <F>(F: Monad<F>) =>
  <A>(defaultValue: Lazy<Kind<F, [A]>>) =>
  (fa: OptionT<F, A>): Kind<F, [A]> =>
    F.flatMap_(fa, opt => opt.fold(() => defaultValue(), F.pure));

OptionT.fold =
  <F>(F: Functor<F>) =>
  <A, B, C = B>(onNone: () => B, onSome: (a: A) => C) =>
  (fa: OptionT<F, A>): Kind<F, [B | C]> =>
    F.map_(fa, opt => opt.fold(onNone, onSome));

// -- Instances

OptionT.EqK = cached(
  <F>(F: EqK<F>): EqK<$<OptionTF, [F]>> =>
    EqK.of<$<OptionTF, [F]>>({
      liftEq: <A>(E: Eq<A>) => F.liftEq(Option.Eq(E)),
    }),
);

OptionT.Defer = cached(
  <F>(F: Defer<F>): Defer<$<OptionTF, [F]>> =>
    Defer.of<$<OptionTF, [F]>>({ defer: F.defer }),
);

OptionT.Functor = cached(
  <F>(F: Functor<F>): Functor<$<OptionTF, [F]>> =>
    Functor.of<$<OptionTF, [F]>>({
      map_: (fa, f) => F.map_(fa, opt => opt.map(f)),
    }),
);

OptionT.Apply = cached(
  <F>(F: Monad<F>): Apply<$<OptionTF, [F]>> =>
    Apply.of<$<OptionTF, [F]>>({
      ...OptionT.Functor(F),
      ap_: (ff, fa) =>
        F.flatMap_(ff, f =>
          f.fold(
            () => F.pure(None),
            f => F.map_(fa, a => a.map(f)),
          ),
        ),
    }),
);

OptionT.Applicative = cached(
  <F>(F: Monad<F>): Applicative<$<OptionTF, [F]>> =>
    Applicative.of<$<OptionTF, [F]>>({
      ...OptionT.Apply(F),
      pure: <A>(a: A) => F.pure(Some(a)),
    }),
);

OptionT.ApplicativeError = cached(
  <F, E>(F: MonadError<F, E>): ApplicativeError<$<OptionTF, [F]>, E> =>
    ApplicativeError.of<$<OptionTF, [F]>, E>({
      ...OptionT.Applicative(F),
      throwError: F.throwError,
      handleErrorWith_: F.handleErrorWith_,
    }),
);

OptionT.Monad = cached(
  <F>(F: Monad<F>): Monad<$<OptionTF, [F]>> =>
    Monad.of<$<OptionTF, [F]>>({
      ...OptionT.Applicative(F),
      flatMap_: (fa, f) =>
        F.flatMap_(fa, opt => opt.fold(() => F.pure(None), f)),
      tailRecM_: <A, B>(
        a0: A,
        f: (a: A) => OptionT<F, Either<A, B>>,
      ): OptionT<F, B> =>
        F.tailRecM(a0)(a =>
          F.map_(f(a), opt =>
            opt.fold(
              () => Right(None),
              a => a.map(Some),
            ),
          ),
        ),
    }),
);

OptionT.MonadError = cached(
  <F, E>(F: MonadError<F, E>): MonadError<$<OptionTF, [F]>, E> =>
    MonadError.of<$<OptionTF, [F]>, E>({
      ...OptionT.Monad(F),
      ...OptionT.ApplicativeError(F),
    }),
);

OptionT.Alternative = cached(
  <F>(F: Monad<F>): Alternative<$<OptionTF, [F]>> =>
    Alternative.of<$<OptionTF, [F]>>({
      ...OptionT.Applicative(F),
      emptyK: () => F.pure(None),
      combineK_: (fa, fb) =>
        F.flatMap_(fa, opt => (opt.isEmpty ? fb() : F.pure(opt))),
    }),
);

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface OptionTF extends TyK<[unknown, unknown]> {
  [$type]: OptionT<TyVar<this, 0>, TyVar<this, 1>>;
}
