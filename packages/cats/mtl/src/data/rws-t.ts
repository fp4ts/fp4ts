// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, id, Kind, tupled, TyK, TyVar } from '@fp4ts/core';
import {
  Applicative,
  Defer,
  Functor,
  isMonadDefer,
  Monad,
  MonadError,
  MonadDefer,
} from '@fp4ts/cats-core';
import { Either, Left, Right } from '@fp4ts/cats-core/lib/data';
import { Monoid, Semigroup } from '@fp4ts/cats-kernel';
import { MonadReader } from '../monad-reader';
import { MonadState } from '../monad-state';
import { MonadWriter } from '../monad-writer';

/**
 * Church-encoded RWST monad.
 */

export type RWST<R, W, S, F, A> = <X>(
  g: (a: A, s: S, w: W) => Kind<F, [X]>,
) => (r: R, s: S, w: W) => Kind<F, [X]>;
export const RWST = function () {};

RWST.pure =
  <R, W, S, F, A>(a: A): RWST<R, W, S, F, A> =>
  g =>
  (_, s, w) =>
    g(a, s, w);

RWST.ask = <R, W, S, F>(): RWST<R, W, S, F, R> => id;
RWST.local_ =
  <R, W, S, F, A>(
    rwsfa: RWST<R, W, S, F, A>,
    f: (r: R) => R,
  ): RWST<R, W, S, F, A> =>
  g =>
  (r, s, w) =>
    rwsfa(g)(f(r), s, w);

RWST.get =
  <R, W, S, F>(): RWST<R, W, S, F, S> =>
  g =>
  (r, s, w) =>
    g(s, s, w);

RWST.set =
  <R, W, S, F>(s: S): RWST<R, W, S, F, void> =>
  g =>
  (r, _, w) =>
    g(undefined, s, w);

RWST.state =
  <R, W, S, F, A>(runState: (s: S) => [A, S]): RWST<R, W, S, F, A> =>
  g =>
  (_, s, w) => {
    const [a, s2] = runState(s);
    return g(a, s2, w);
  };

RWST.modify =
  <R, W, S, F>(f: (s: S) => S): RWST<R, W, S, F, void> =>
  g =>
  (_, s, w) =>
    g(undefined, f(s), w);

RWST.inspect =
  <R, W, S, F, A>(f: (s: S) => A): RWST<R, W, S, F, A> =>
  g =>
  (_, s, w) =>
    g(f(s), s, w);

RWST.tell =
  <W>(W: Semigroup<W>) =>
  <R, S, F>(w2: W): RWST<R, W, S, F, void> =>
  g =>
  (_, s, w1) =>
    g(undefined, s, W.combine_(w1, w2));

RWST.listen =
  <R, W, S, F, A>(rwsfa: RWST<R, W, S, F, A>): RWST<R, W, S, F, [A, W]> =>
  g =>
    rwsfa((a, s, w) => g([a, w], s, w));

RWST.censor_ =
  <R, W, S, F, A>(
    rwsfa: RWST<R, W, S, F, A>,
    f: (w: W) => W,
  ): RWST<R, W, S, F, A> =>
  g =>
    rwsfa((a, s, w) => g(a, s, f(w)));

RWST.runASW =
  <F, W>(F: Applicative<F>, W: Monoid<W>) =>
  <R, S, A>(rwsfa: RWST<R, W, S, F, A>) =>
  (r: R, s: S): Kind<F, [[A, S, W]]> =>
    rwsfa((a, s, w) => F.pure(tupled(a, s, w)))(r, s, W.empty);

RWST.map_ =
  <R, W, S, F, A, B>(
    rwsfa: RWST<R, W, S, F, A>,
    f: (a: A) => B,
  ): RWST<R, W, S, F, B> =>
  g =>
    rwsfa((a, s, w) => g(f(a), s, w));

RWST.flatMap_ =
  <R, W, S, F, A, B>(
    rwsfa: RWST<R, W, S, F, A>,
    f: (a: A) => RWST<R, W, S, F, B>,
  ): RWST<R, W, S, F, B> =>
  g =>
  (r, s, w) =>
    rwsfa((a, s, w) => f(a)(g)(r, s, w))(r, s, w);

/**
 * Version of the `flatMap` that uses `Defer` type class instance to add stack
 * safety. On the contrary to the rest of the `StateT` functions, this one does
 * not add allocation of `F` for each operation.
 *
 * This function is used whenever a `Monad` instance is required for a stack safe
 * monad `F`.
 */
RWST.flatMapDefer_ =
  <F>(F: Defer<F>) =>
  <R, W, S, A, B>(
    rwsfa: RWST<R, W, S, F, A>,
    f: (a: A) => RWST<R, W, S, F, B>,
  ): RWST<R, W, S, F, B> =>
  g =>
  (r, s, w) =>
    F.defer(() => rwsfa((a, s, w) => f(a)(g)(r, s, w))(r, s, w));

RWST.tailRecM_ =
  <F>(F: Monad<F>) =>
  <R, S, W, A, B>(
    a: A,
    f: (a: A) => RWST<R, W, S, F, Either<A, B>>,
  ): RWST<R, W, S, F, B> =>
  <R>(g: (b: B, s: S, w: W) => Kind<F, [R]>) =>
  (r, s, w) =>
    F.tailRecM_(tupled(a, s, w), ([a, s, w]) =>
      f(a)((ea, s, w) =>
        ea.fold<Kind<F, [Either<[A, S, W], R>]>>(
          (a: A) => F.pure(Left(tupled(a, s, w))),
          (b: B) => F.map_(g(b, s, w), Right),
        ),
      )(r, s, w),
    );

// -- Instances

RWST.Functor = <R, W, S, F>(): Functor<$<RWSTF, [R, W, S, F]>> =>
  Functor.of({ map_: RWST.map_ });

RWST.Monad = <R, W, S, F>(F: Monad<F>): Monad<$<RWSTF, [R, W, S, F]>> =>
  isMonadDefer(F)
    ? MonadDefer.of({
        ...RWST.Functor(),
        pure: RWST.pure,
        flatMap_: RWST.flatMapDefer_(F),
      })
    : Monad.of({
        ...RWST.Functor(),
        pure: RWST.pure,
        flatMap_: RWST.flatMap_,
        tailRecM_: RWST.tailRecM_(F),
      });

RWST.MonadError = <R, W, S, F, E>(
  F: MonadError<F, E>,
): MonadError<$<RWSTF, [R, W, S, F]>, E> =>
  MonadError.of({
    ...RWST.Monad(F),
    throwError:
      <A>(e: E) =>
      <R>(g: (a: A, s: S, w: W) => Kind<F, [R]>) =>
      _ =>
        F.throwError<R>(e),
    handleErrorWith_:
      <A>(sfa: RWST<R, W, S, F, A>, h: (e: E) => RWST<R, W, S, F, A>) =>
      <R>(g: (a: A, s: S, w: W) => Kind<F, [R]>) =>
      (r, s, w) =>
        F.handleErrorWith_(sfa(g)(r, s, w), e => h(e)(g)(r, s, w)),
  });

RWST.MonadReader = <R, W, S, F>(
  F: Monad<F>,
): MonadReader<$<RWSTF, [R, W, S, F]>, R> =>
  MonadReader.of<$<RWSTF, [R, W, S, F]>, R>({
    ...RWST.Monad(F),
    ask: RWST.ask,
    local_: RWST.local_,
  });

RWST.MonadWriter = <R, W, S, F>(
  F: Monad<F>,
  W: Monoid<W>,
): MonadWriter<$<RWSTF, [R, W, S, F]>, W> =>
  MonadWriter.of<$<RWSTF, [R, W, S, F]>, W>({
    monoid: W,
    ...RWST.Monad(F),
    tell: RWST.tell(W),
    listen: RWST.listen,
    censor_: RWST.censor_,
  });

RWST.MonadState = <R, W, S, F>(
  F: Monad<F>,
): MonadState<$<RWSTF, [R, W, S, F]>, S> =>
  MonadState.of<$<RWSTF, [R, W, S, F]>, S>({
    ...RWST.Monad(F),
    get: RWST.get(),
    set: RWST.set,
    modify: RWST.modify,
    inspect: RWST.inspect,
  });

// -- HKT

export interface RWSTF
  extends TyK<[unknown, unknown, unknown, unknown, unknown]> {
  [$type]: RWST<
    TyVar<this, 0>,
    TyVar<this, 1>,
    TyVar<this, 2>,
    TyVar<this, 3>,
    TyVar<this, 4>
  >;
}
