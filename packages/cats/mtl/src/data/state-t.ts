// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, F1, Kind, tupled, TyK, TyVar } from '@fp4ts/core';
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
import { MonadState } from '../monad-state';

/**
 * Church-encoded StateT monad.
 *
 * This is a little bit less safe, but more performant implementation of the State
 * monad, having roughly 10-30% better performance over the canonical implementation.
 */
export type StateT<S, F, A> = <R>(
  g: (a: A) => (s: S) => Kind<F, [R]>,
) => (s: S) => Kind<F, [R]>;
export const StateT = function () {};

StateT.pure =
  <F, S, A>(a: A): StateT<S, F, A> =>
  g =>
    g(a);

StateT.get =
  <F, S>(): StateT<S, F, S> =>
  g =>
  s =>
    g(s)(s);

StateT.set =
  <F, S>(s: S): StateT<S, F, void> =>
  g =>
  _ =>
    g(undefined)(s);

StateT.state =
  <F, S, A>(run: (s: S) => [A, S]): StateT<S, F, A> =>
  g =>
  s => {
    const [a, s2] = run(s);
    return g(a)(s2);
  };

StateT.modify =
  <F, S>(f: (s: S) => S): StateT<S, F, undefined> =>
  g =>
    F1.compose(g(undefined), f);

StateT.inspect =
  <F, S, A>(f: (s: S) => A): StateT<S, F, A> =>
  g =>
  s =>
    g(f(s))(s);

StateT.runA =
  <F>(F: Applicative<F>) =>
  <S, A>(sfa: StateT<S, F, A>): ((s: S) => Kind<F, [A]>) =>
    sfa(a => _ => F.pure(a));

StateT.runS =
  <F>(F: Applicative<F>) =>
  <S, A>(s: StateT<S, F, A>): ((s: S) => Kind<F, [S]>) =>
    s(_ => s => F.pure(s));

StateT.runAS =
  <F>(F: Applicative<F>) =>
  <S, A>(sfa: StateT<S, F, A>): ((s: S) => Kind<F, [[A, S]]>) =>
    sfa(a => s => F.pure([a, s]));

StateT.map_ =
  <F, S, A, B>(sfa: StateT<S, F, A>, f: (a: A) => B): StateT<S, F, B> =>
  g =>
    sfa(F1.compose(g, f));

StateT.ap_ =
  <F, S, A, B>(
    ff: StateT<S, F, (a: A) => B>,
    fa: StateT<S, F, A>,
  ): StateT<S, F, B> =>
  g =>
    ff(f => fa(F1.compose(g, f)));

StateT.map2_ =
  <F, S, A, B>(fa: StateT<S, F, A>, fb: StateT<S, F, B>) =>
  <C>(f: (a: A, b: B) => C): StateT<S, F, C> =>
  g =>
    fa(a => fb(b => g(f(a, b))));

StateT.flatMap_ =
  <F, S, A, B>(
    sfa: StateT<S, F, A>,
    f: (a: A) => StateT<S, F, B>,
  ): StateT<S, F, B> =>
  g =>
    sfa(a => f(a)(g));

/**
 * Version of the `flatMap` that uses `Defer` type class instance to add stack
 * safety. On the contrary to the rest of the `StateT` functions, this one does
 * not add allocation of `F` for each operation.
 *
 * This function is used whenever a `Monad` instance is required for a stack safe
 * monad `F`.
 */
StateT.flatMapDefer_ =
  <F>(F: Defer<F>) =>
  <S, A, B>(
    sfa: StateT<S, F, A>,
    f: (a: A) => StateT<S, F, B>,
  ): StateT<S, F, B> =>
  g =>
  s =>
    F.defer(() => sfa(a => f(a)(g))(s));

StateT.tailRecM_ =
  <F>(F: Monad<F>) =>
  <S, A, B>(a: A, f: (a: A) => StateT<S, F, Either<A, B>>): StateT<S, F, B> =>
  <R>(g: (b: B) => (s: S) => Kind<F, [R]>) =>
  s =>
    F.tailRecM_(tupled(a, s), ([a, s]) =>
      f(a)(
        ea => s =>
          ea.fold<Kind<F, [Either<[A, S], R>]>>(
            (a: A) => F.pure(Left(tupled(a, s))),
            (b: B) => F.map_(g(b)(s), Right),
          ),
      )(s),
    );

// -- Instances

StateT.Functor = <F, S>(): Functor<$<StateTF, [S, F]>> =>
  Functor.of({ map_: StateT.map_ });

StateT.Applicative = <F, S>(): Applicative<$<StateTF, [S, F]>> =>
  Applicative.of({
    ...StateT.Functor(),
    pure: StateT.pure,
    ap_: StateT.ap_,
    map2_: StateT.map2_,
  });

StateT.Monad = <F, S>(F: Monad<F>): Monad<$<StateTF, [S, F]>> =>
  isStackSafeMonad(F)
    ? StackSafeMonad.of({
        ...StateT.Applicative(),
        flatMap_: StateT.flatMapDefer_(F),
      })
    : Monad.of({
        ...StateT.Functor(),
        ...StateT.Applicative(),
        flatMap_: StateT.flatMap_,
        tailRecM_: StateT.tailRecM_(F),
      });

StateT.MonadError = <F, S, E>(
  F: MonadError<F, E>,
): MonadError<$<StateTF, [S, F]>, E> =>
  MonadError.of({
    ...StateT.Monad(F),
    throwError:
      <A>(e: E) =>
      <R>(g: (a: A) => (s: S) => Kind<F, [R]>) =>
      _ =>
        F.throwError<R>(e),
    handleErrorWith_:
      <A>(sfa: StateT<S, F, A>, h: (e: E) => StateT<S, F, A>) =>
      <R>(g: (a: A) => (s: S) => Kind<F, [R]>) =>
      s =>
        F.handleErrorWith_(sfa(g)(s), e => h(e)(g)(s)),
  });

StateT.MonadState = <F, S>(F: Monad<F>): MonadState<$<StateTF, [S, F]>, S> =>
  MonadState.of<$<StateTF, [S, F]>, S>({
    ...StateT.Monad(F),
    get: StateT.get(),
    set: StateT.set,
    modify: StateT.modify,
    inspect: StateT.inspect,
  });

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface StateTF extends TyK<[unknown, unknown, unknown]> {
  [$type]: StateT<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
