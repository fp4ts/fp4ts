// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, tupled, TyK, TyVar } from '@fp4ts/core';
import {
  Applicative,
  Defer,
  Functor,
  isStackSafeMonad,
  Monad,
  MonadError,
  StackSafeMonad,
} from '@fp4ts/cats-core';
import { Either, Left, Right } from '@fp4ts/cats-core/lib/data';
import { Monoid, Semigroup } from '@fp4ts/cats-kernel';
import { MonadWriter } from '../monad-writer';

/**
 * Church-encoded WriterT monad.
 *
 * This is a less safe, but more performant implementation of the Writer monad,
 * having roughly 10-30% better performance over the canonical implementation.
 */
export type WriterT<F, W, A> = <R>(
  g: (a: A) => (w: W) => Kind<F, [R]>,
) => (w: W) => Kind<F, [R]>;
export const WriterT = function () {};

WriterT.tell =
  <W>(W: Semigroup<W>) =>
  <F>(w2: W): WriterT<F, W, void> =>
  g =>
  w1 =>
    g(undefined)(W.combine_(w1, () => w2));

WriterT.listen =
  <F, W, A>(fwa: WriterT<F, W, A>): WriterT<F, W, [A, W]> =>
  g =>
    fwa(a => w => g([a, w])(w));

WriterT.censor_ =
  <F, W, A>(fwa: WriterT<F, W, A>, f: (w: W) => W): WriterT<F, W, A> =>
  g =>
    fwa(a => w => g(a)(f(w)));

WriterT.pure =
  <F, W, A>(a: A): WriterT<F, W, A> =>
  g =>
    g(a);

WriterT.runA =
  <F, W>(F: Applicative<F>, W: Monoid<W>) =>
  <A>(fwa: WriterT<F, W, A>): Kind<F, [A]> =>
    fwa(a => _ => F.pure(a))(W.empty);

WriterT.runW =
  <F, W>(F: Applicative<F>, W: Monoid<W>) =>
  <A>(fwa: WriterT<F, W, A>): Kind<F, [W]> =>
    fwa(_ => w => F.pure(w))(W.empty);

WriterT.runAW =
  <F, W>(F: Applicative<F>, W: Monoid<W>) =>
  <A>(fwa: WriterT<F, W, A>): Kind<F, [[A, W]]> =>
    fwa(a => w => F.pure([a, w] as [A, W]))(W.empty);

WriterT.map_ =
  <F, W, A, B>(fwa: WriterT<F, W, A>, f: (a: A) => B): WriterT<F, W, B> =>
  g =>
    fwa(a => g(f(a)));

WriterT.ap_ =
  <F, W, A, B>(
    ff: WriterT<F, W, (a: A) => B>,
    fa: WriterT<F, W, A>,
  ): WriterT<F, W, B> =>
  g =>
    ff(f => fa(a => g(f(a))));

WriterT.map2_ =
  <F, W, A, B>(fa: WriterT<F, W, A>, fb: WriterT<F, W, B>) =>
  <C>(f: (a: A, b: B) => C): WriterT<F, W, C> =>
  g =>
    fa(a => fb(b => g(f(a, b))));

WriterT.flatMap_ =
  <F, W, A, B>(
    fwa: WriterT<F, W, A>,
    f: (a: A) => WriterT<F, W, B>,
  ): WriterT<F, W, B> =>
  g =>
    fwa(a => f(a)(g));

/**
 * Version of the `flatMap` that uses `Defer` type class instance to add stack
 * safety. On the contrary to the rest of the `WriterT` functions, this one does
 * not add allocation of `F` for each operation.
 *
 * This function is used whenever a `Monad` instance is required for a stack safe
 * monad `F`.
 */
WriterT.flatMapDefer_ =
  <F>(F: Defer<F>) =>
  <W, A, B>(
    fwa: WriterT<F, W, A>,
    f: (a: A) => WriterT<F, W, B>,
  ): WriterT<F, W, B> =>
  g =>
  w =>
    F.defer(() => fwa(a => f(a)(g))(w));

WriterT.tailRecM_ =
  <F>(F: Monad<F>) =>
  <W, A, B>(a: A, f: (a: A) => WriterT<F, W, Either<A, B>>): WriterT<F, W, B> =>
  <R>(g: (b: B) => (w: W) => Kind<F, [R]>) =>
  w =>
    F.tailRecM_(tupled(a, w), ([a, w]) =>
      f(a)(
        ea => w =>
          ea.fold<Kind<F, [Either<[A, W], R>]>>(
            (a: A) => F.pure(Left(tupled(a, w))),
            (b: B) => F.map_(g(b)(w), Right),
          ),
      )(w),
    );

// -- Instances

WriterT.Functor = <F, W>(): Functor<$<WriterTF, [F, W]>> =>
  Functor.of({ map_: WriterT.map_ });

WriterT.Applicative = <F, S>(): Applicative<$<WriterTF, [S, F]>> =>
  Applicative.of({
    ...WriterT.Functor(),
    pure: WriterT.pure,
    ap_: WriterT.ap_,
    map2_: WriterT.map2_,
  });

WriterT.Monad = <F, W>(F: Monad<F>): Monad<$<WriterTF, [F, W]>> =>
  isStackSafeMonad(F)
    ? StackSafeMonad.of({
        ...WriterT.Applicative(),
        flatMap_: WriterT.flatMapDefer_(F),
      })
    : Monad.of({
        ...WriterT.Applicative(),
        flatMap_: WriterT.flatMap_,
        tailRecM_: WriterT.tailRecM_(F),
      });

WriterT.MonadError = <F, W, E>(
  F: MonadError<F, E>,
): MonadError<$<WriterTF, [F, W]>, E> =>
  MonadError.of<$<WriterTF, [F, W]>, E>({
    ...WriterT.Monad(F),
    throwError:
      <A>(e: E) =>
      <R>(g: (a: A) => (w: W) => Kind<F, [R]>) =>
      _ =>
        F.throwError<R>(e),
    handleErrorWith_:
      <A>(sfa: WriterT<F, W, A>, h: (e: E) => WriterT<F, W, A>) =>
      <R>(g: (a: A) => (w: W) => Kind<F, [R]>) =>
      s =>
        F.handleErrorWith_(sfa(g)(s), e => h(e)(g)(s)),
  });

WriterT.MonadWriter = <F, W>(
  F: Monad<F>,
  W: Monoid<W>,
): MonadWriter<$<WriterTF, [F, W]>, W> =>
  MonadWriter.of<$<WriterTF, [F, W]>, W>({
    monoid: W,
    ...WriterT.Monad(F),
    tell: WriterT.tell(W),
    listen: WriterT.listen,
    censor_: WriterT.censor_,
  });

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface WriterTF extends TyK<[unknown, unknown, unknown]> {
  [$type]: WriterT<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
