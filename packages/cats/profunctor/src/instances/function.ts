// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, F1, id, Kind, lazy } from '@fp4ts/core';
import { Defer, Function1F } from '@fp4ts/cats-core';
import {
  Either,
  Identity,
  IdentityF,
  Left,
  Right,
} from '@fp4ts/cats-core/lib/data';

import { Choice, Cochoice } from '../choice';
import { Closed } from '../closed';
import { Mapping } from '../mapping';
import { Profunctor } from '../profunctor';
import { Corepresentable, Representable } from '../representable';
import { Cosieve, Sieve } from '../sieve';
import { Costrong, Strong } from '../strong';
import { Traversing } from '../traversing';

export const function1Profunctor = lazy(() =>
  Profunctor.of<Function1F>({
    lmap_: F1.compose,
    rmap_: F1.andThen,
  }),
);

export const function1Strong = lazy(
  (): Strong<Function1F> =>
    Strong.of<Function1F>({
      ...function1Profunctor(),

      first:
        <C>() =>
        <A, B>(f: (a: A) => B) =>
        ([a, c]: [A, C]): [B, C] =>
          [f(a), c],

      second:
        <C>() =>
        <A, B>(f: (a: A) => B) =>
        ([c, a]: [C, A]): [C, B] =>
          [c, f(a)],
    }),
);

export const function1Costrong = lazy(
  (): Costrong<Function1F> =>
    Costrong.of<Function1F>({
      ...function1Profunctor(),

      unfirst_:
        <F, A, B, C>(
          F: Defer<F>,
          f: (a: [A, Kind<F, [C]>]) => [B, Kind<F, [C]>],
        ) =>
        (a: A): B => {
          const bfc: [B, Kind<F, [C]>] = f([a, F.defer(() => bfc[1])]);
          return bfc[0];
        },

      unsecond_:
        <F, A, B, C>(
          F: Defer<F>,
          f: (a: [Kind<F, [C]>, A]) => [Kind<F, [C]>, B],
        ) =>
        (a: A): B => {
          const fcb: [Kind<F, [C]>, B] = f([F.defer(() => fcb[0]), a]);
          return fcb[1];
        },
    }),
);

export const function1Choice = lazy(() =>
  Choice.of<Function1F>({
    ...function1Profunctor(),

    left:
      <C>() =>
      <A, B>(f: (a: A) => B) =>
      (ac: Either<A, C>): Either<B, C> =>
        ac.fold(a => Left(f(a)), Right),

    right:
      <C>() =>
      <A, B>(f: (a: A) => B) =>
      (ac: Either<C, A>): Either<C, B> =>
        ac.fold(Left, a => Right(f(a))),
  }),
);

export const function1Cochoice = lazy((): Cochoice<Function1F> => {
  const goUnleft = <A, B, C>(
    f: (ac: Either<A, C>) => Either<B, C>,
    ac: Either<A, C>,
  ): Eval<B> => {
    const bc = f(ac);
    return bc.isRight()
      ? Eval.defer(() => goUnleft(f, bc))
      : Eval.now(bc.getLeft);
  };

  const goUnright = <A, B, C>(
    f: (ac: Either<C, A>) => Either<C, B>,
    ca: Either<C, A>,
  ): Eval<B> => {
    const cb = f(ca);
    return cb.isLeft() ? Eval.defer(() => goUnright(f, cb)) : Eval.now(cb.get);
  };

  return Cochoice.of<Function1F>({
    ...function1Profunctor(),

    unleft:
      <A, B, C>(f: (ac: Either<A, C>) => Either<B, C>) =>
      (a: A): B =>
        goUnleft(f, Left(a)).value,

    unright:
      <A, B, C>(f: (ac: Either<C, A>) => Either<C, B>) =>
      (a: A): B =>
        goUnright(f, Right(a)).value,
  });
});

export const function1Closed = lazy(() =>
  Closed.of<Function1F>({
    ...function1Profunctor(),

    closed:
      <X>() =>
      <A, B>(f: (a: A) => B) =>
      (xa: (x: X) => A): ((x: X) => B) =>
        F1.compose(f, xa),
  }),
);

export const function1Sieve = lazy(
  (): Sieve<Function1F, IdentityF> =>
    Sieve.of<Function1F, IdentityF>({
      ...function1Profunctor(),

      F: Identity.Functor,

      sieve: id,
    }),
);

export const function1Cosieve = lazy(
  (): Cosieve<Function1F, IdentityF> =>
    Cosieve.of<Function1F, IdentityF>({
      ...function1Profunctor(),

      C: Identity.Functor,

      cosieve: id,
    }),
);

export const function1Representable = lazy(
  (): Representable<Function1F, IdentityF> =>
    Representable.of<Function1F, IdentityF>({
      ...function1Sieve(),
      ...function1Strong(),
      tabulate: id,
    }),
);

export const function1Corepresentable = lazy(() =>
  Corepresentable.of<Function1F, IdentityF>({
    ...function1Cosieve(),
    ...function1Costrong(),
    cotabulate: id,
  }),
);

export const function1Traversing = lazy(() =>
  Traversing.of<Function1F>({
    ...function1Choice(),
    ...function1Strong(),

    traverse_: (G, pab) => G.map(pab),
    wander_: (pab, f) => f(Identity.Applicative)(pab),
  }),
);

export const function1Mapping = lazy(() =>
  Mapping.of<Function1F>({
    ...function1Closed(),
    ...function1Traversing(),

    map_: (F, pab) => F.map(pab),
    roam_: (pab, f) => f(pab),
  }),
);
