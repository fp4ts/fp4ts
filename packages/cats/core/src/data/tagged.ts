// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Lazy, lazy, TyK, TyVar } from '@fp4ts/core';
import { Profunctor } from '../arrow';
import { Bifunctor } from '../bifunctor';
import { EqK } from '../eq-k';
import { Monad } from '../monad';
import { Identity } from './identity';

export type Tagged<S, B> = B;

export const Tagged: TaggedObj = function <S, B>(b: B): Tagged<S, B> {
  return b;
} as any;

interface TaggedObj {
  <S, B>(b: B): Tagged<S, B>;

  // -- Instances

  EqK<S>(): EqK<$<TaggedF, [S]>>;
  Monad<S>(): Monad<$<TaggedF, [S]>>;
  Bifunctor: Bifunctor<TaggedF>;
  Profunctor: Profunctor<TaggedF>;
}

// -- Instances

const taggedEqK: <S>() => EqK<$<TaggedF, [S]>> = lazy(
  <S>() => Identity.EqK as any,
) as <S>() => EqK<$<TaggedF, [S]>>;

const taggedMonad: <S>() => Monad<$<TaggedF, [S]>> = lazy(
  <S>() => Identity.Monad as any,
) as <S>() => Monad<$<TaggedF, [S]>>;

const taggedBifunctor: Lazy<Bifunctor<TaggedF>> = lazy(() =>
  Bifunctor.of({
    bimap_: <A, B, C, D>(tab: Tagged<A, B>, f: (a: A) => C, g: (b: B) => D) =>
      g(tab),
  }),
);

const taggedProfunctor: Lazy<Profunctor<TaggedF>> = lazy(() =>
  Profunctor.of({
    dimap_: <A, B, C, D>(fab: Tagged<A, B>, f: (c: C) => A, g: (b: B) => D) =>
      g(fab),
  }),
);

Tagged.EqK = taggedEqK;
Tagged.Monad = taggedMonad;
Object.defineProperty(Tagged, 'Bifunctor', {
  get() {
    return taggedBifunctor();
  },
});
Object.defineProperty(Tagged, 'Profunctor', {
  get() {
    return taggedProfunctor();
  },
});

// -- HKT

export interface KindSnd extends TyK<[unknown, unknown]> {
  [$type]: TyVar<this, 1>;
}

/**
 * @category Type Constructor
 * @category Data
 */
export interface TaggedF extends TyK<[unknown, unknown]> {
  [$type]: TyVar<this, 1>;
}
