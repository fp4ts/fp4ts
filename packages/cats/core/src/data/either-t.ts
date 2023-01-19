// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '@fp4ts/cats-kernel';
import { $, $type, cached, Kind, TyK, TyVar } from '@fp4ts/core';
import { Applicative } from '../applicative';
import { Bifunctor } from '../bifunctor';
import { Defer } from '../defer';
import { EqK } from '../eq-k';
import { Functor } from '../functor';
import { Monad } from '../monad';
import { MonadError } from '../monad-error';
import { SemigroupK } from '../semigroup-k';
import { Either, Left, Right } from './either';

export type EitherT<F, E, A> = Kind<F, [Either<E, A>]>;
export const EitherT = function <F, E, A>(
  fa: Kind<F, [Either<E, A>]>,
): EitherT<F, E, A> {
  return fa;
};

EitherT.Right =
  <F>(F: Applicative<F>) =>
  <A, E = never>(a: A): EitherT<F, E, A> =>
    F.pure(Right(a));

EitherT.Left =
  <F>(F: Applicative<F>) =>
  <E, A = never>(e: E): EitherT<F, E, A> =>
    F.pure(Left(e));

EitherT.liftF =
  <F>(F: Functor<F>) =>
  <A, E = never>(fa: Kind<F, [A]>): EitherT<F, E, A> =>
    F.map_(fa, Right<A, E>);

// -- Instances

EitherT.EqK = <F, E>(F: EqK<F>, E: Eq<E>): EqK<$<EitherTF, [F, E]>> =>
  EqK.of<$<EitherTF, [F, E]>>({
    liftEq: <A>(A: Eq<A>) => F.liftEq(Either.EqK(E).liftEq(A)),
  });

EitherT.Defer = cached(
  <F, E>(F: Defer<F>): Defer<$<EitherTF, [F, E]>> =>
    Defer.of<$<EitherTF, [F, E]>>({ defer: F.defer }),
);

EitherT.Functor = cached(
  <F, E>(F: Functor<F>): Functor<$<EitherTF, [F, E]>> =>
    Functor.of<$<EitherTF, [F, E]>>({
      map_: (fa, f) => F.map_(fa, ea => ea.map(f)),
    }),
);

EitherT.Bifunctor = cached(
  <F>(F: Functor<F>): Bifunctor<$<EitherTF, [F]>> =>
    Bifunctor.of<$<EitherTF, [F]>>({
      bimap_: (fea, f, g) => F.map_(fea, ea => ea.bimap(f, g)),
    }),
);

EitherT.Monad = cached(
  <F, E>(F: Monad<F>): Monad<$<EitherTF, [F, E]>> =>
    Monad.of<$<EitherTF, [F, E]>>({
      ...EitherT.Functor(F),
      pure: EitherT.Right(F),
      flatMap_: (fa, f) => F.flatMap_(fa, ea => ea.fold(EitherT.Left(F), f)),
      tailRecM_: <A, B>(
        a0: A,
        f: (a: A) => EitherT<F, E, Either<A, B>>,
      ): EitherT<F, E, B> =>
        F.tailRecM(a0)(a =>
          F.map_(f(a), eab =>
            eab.fold(
              e => Right(Left(e)),
              ab =>
                ab.fold(
                  a => Left(a),
                  b => Right(Right(b)),
                ),
            ),
          ),
        ),
    }),
);

EitherT.MonadError = cached(
  <F, E>(F: Monad<F>): MonadError<$<EitherTF, [F, E]>, E> =>
    MonadError.of<$<EitherTF, [F, E]>, E>({
      ...EitherT.Monad(F),
      throwError: EitherT.Left(F),
      handleErrorWith_: (fa, h) =>
        F.flatMap_(fa, ea => ea.fold(h, EitherT.Right(F))),
    }),
);

EitherT.SemigroupK = cached(
  <F, E>(F: Monad<F>): SemigroupK<$<EitherTF, [F, E]>> =>
    SemigroupK.of<$<EitherTF, [F, E]>>({
      combineK_: (fa, lfb) =>
        F.flatMap_(fa, ea => ea.fold(() => lfb, EitherT.Right(F))),
    }),
);

// -- HKT

export interface EitherTF extends TyK<[unknown, unknown, unknown]> {
  [$type]: EitherT<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
