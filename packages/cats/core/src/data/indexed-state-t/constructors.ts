// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind } from '@fp4ts/core';
import { Applicative } from '../../applicative';
import { Eval, EvalF } from '../../eval';
import { IndexedStateT } from './algebra';

export const pure =
  <F>(F: Applicative<F>) =>
  <S, A>(a: A): IndexedStateT<F, S, S, A> =>
    lift(F)(s => F.pure([s, a]));

export const lift =
  <F>(F: Applicative<F>) =>
  <SA, SB, A>(f: (sa: SA) => Kind<F, [[SB, A]]>): IndexedStateT<F, SA, SB, A> =>
    new IndexedStateT(F.pure(f));

export const liftF =
  <F>(F: Applicative<F>) =>
  <S, A>(fa: Kind<F, [A]>): IndexedStateT<F, S, S, A> =>
    lift(F)(s => F.map_(fa, a => [s, a]));

export const modify =
  <F>(F: Applicative<F>) =>
  <SA, SB>(f: (sa: SA) => SB): IndexedStateT<F, SA, SB, void> =>
    new IndexedStateT(F.pure(sa => F.pure([f(sa), undefined])));

export const modifyF =
  <F>(F: Applicative<F>) =>
  <SA, SB>(f: (sa: SA) => Kind<F, [SB]>): IndexedStateT<F, SA, SB, void> =>
    new IndexedStateT(F.pure(sa => F.map_(f(sa), sb => [sb, undefined])));

export const inspect =
  <F>(F: Applicative<F>) =>
  <S, A>(f: (s: S) => A): IndexedStateT<F, S, S, A> =>
    lift(F)(s => F.pure([s, f(s)]));

export const inspectF =
  <F>(F: Applicative<F>) =>
  <S, A>(f: (s: S) => Kind<F, [A]>): IndexedStateT<F, S, S, A> =>
    lift(F)(s => F.map_(f(s), a => [s, a]));

export const set =
  <F>(F: Applicative<F>) =>
  <SA, SB>(sb: SB): IndexedStateT<F, SA, SB, void> =>
    modify(F)(() => sb);

export const setF =
  <F>(F: Applicative<F>) =>
  <SA, SB>(sb: Kind<F, [SB]>): IndexedStateT<F, SA, SB, void> =>
    modifyF(F)(() => sb);

export const get = <F, S>(F: Applicative<F>): IndexedStateT<F, S, S, S> =>
  StateTFunctions.inspect(F)(id);

export const StateTFunctions = Object.freeze({
  pure:
    <F>(F: Applicative<F>) =>
    <S, A>(a: A): IndexedStateT<F, S, S, A> =>
      lift(F)(s => F.pure([s, a])),

  liftF: liftF,

  modify:
    <F>(F: Applicative<F>) =>
    <S>(f: (sa: S) => S): IndexedStateT<F, S, S, void> =>
      new IndexedStateT(F.pure(sa => F.pure([f(sa), undefined]))),

  modifyF:
    <F>(F: Applicative<F>) =>
    <S>(f: (sa: S) => Kind<F, [S]>): IndexedStateT<F, S, S, void> =>
      new IndexedStateT(F.pure(sa => F.map_(f(sa), sb => [sb, undefined]))),

  inspect,
  inspectF,

  set:
    <F>(F: Applicative<F>) =>
    <S>(sb: S): IndexedStateT<F, S, S, void> =>
      modify(F)(() => sb),

  setF:
    <F>(F: Applicative<F>) =>
    <S>(sb: Kind<F, [S]>): IndexedStateT<F, S, S, void> =>
      modifyF(F)(() => sb),

  get,
});

export const StateFunctions = Object.freeze({
  pure: <S, A>(a: A): IndexedStateT<EvalF, S, S, A> =>
    lift(Eval.Applicative)(s => Eval.pure([s, a])),

  modify: <S>(f: (sa: S) => S): IndexedStateT<EvalF, S, S, void> =>
    new IndexedStateT(Eval.pure(sa => Eval.pure([f(sa), undefined]))),

  inspect: <S, A>(f: (s: S) => A): IndexedStateT<EvalF, S, S, A> =>
    lift(Eval.Applicative)(s => Eval.pure([s, f(s)])),

  set: <S>(sb: S): IndexedStateT<EvalF, S, S, void> =>
    modify(Eval.Applicative)(() => sb),

  get: <S>(): IndexedStateT<EvalF, S, S, S> => StateFunctions.inspect(id),
});
