// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { F1, id, lazy } from '@fp4ts/core';
import { Function1F } from '@fp4ts/cats-core';
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

      unfirst:
        <A, B, C>(f: (a: [A, C]) => [B, C]) =>
        (a: A): B =>
          f([a, undefined as any])[0],

      unsecond:
        <A, B, C>(f: (a: [C, A]) => [C, B]) =>
        (a: A): B =>
          f([undefined as any, a])[1],
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

export const function1Cochoice = lazy(() =>
  Cochoice.of<Function1F>({
    ...function1Profunctor(),

    unleft:
      <A, B, C>(f: (ac: Either<A, C>) => Either<B, C>) =>
      (a: A): B =>
        f(Left(a)).fold(id, _ => {
          while (true) {}
        }),

    unright:
      <A, B, C>(f: (ac: Either<C, A>) => Either<C, B>) =>
      (a: A): B =>
        f(Right(a)).fold(_ => {
          while (true) {}
        }, id),
  }),
);

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

// const bottom = new Proxy(
//   {
//     valueOf() {
//       while (true);
//     },
//   },
//   {
//     // get() {
//     //   while (true) {}
//     // },
//     // set() {
//     //   while (true) {}
//     // },
//     // apply() {
//     //   while (true) {}
//     // },
//     // ownKeys() {
//     //   while (true) {}
//     // },
//     // construct() {
//     //   while (true) {}
//     // },
//     // deleteProperty() {
//     //   while (true) {}
//     // },
//     // has() {
//     //   while (true) {}
//     // },
//     // getOwnPropertyDescriptor() {
//     //   while (true) {}
//     // },
//     // getPrototypeOf() {
//     //   while (true) {}
//     // },
//     // defineProperty() {
//     //   while (true) {}
//     // },
//   },
// ) as any as never;
