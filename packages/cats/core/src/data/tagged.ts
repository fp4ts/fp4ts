// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $,
  $type,
  Kind,
  KindOf,
  Lazy,
  lazyVal,
  newtypeK,
  newtypeKDerive,
  TyK,
  TyVar,
} from '@fp4ts/core';
import { Profunctor } from '../arrow';
import { Bifunctor } from '../bifunctor';
import { EqK, EqKF } from '../eq-k';
import { Monad, MonadF } from '../monad';
import { Identity } from './identity';

const TaggedF = newtypeK<KindSnd>()('@fp4ts/cats/core/data/Tagged');

export type Tagged<S, B> = Kind<TaggedF, [S, B]>;

export const Tagged: TaggedObj = function <S, B>(b: B): Tagged<S, B> {
  return TaggedF(b);
} as any;

Tagged.unTag = TaggedF.unapply;

interface TaggedObj {
  <S, B>(b: B): Tagged<S, B>;
  unTag<S, B>(t: Tagged<S, B>): B;

  // -- Instances

  EqK<S>(): EqK<$<TaggedF, [S]>>;
  Monad<S>(): Monad<$<TaggedF, [S]>>;
  Bifunctor: Bifunctor<TaggedF>;
  Profunctor: Profunctor<TaggedF>;
}

// -- Instances

const taggedEqK: <S>() => EqK<$<TaggedF, [S]>> = lazyVal(<S>() =>
  newtypeKDerive<EqKF, $<TaggedF, [S]>>()(Identity.EqK),
) as <S>() => EqK<$<TaggedF, [S]>>;

const taggedMonad: <S>() => Monad<$<TaggedF, [S]>> = lazyVal(<S>() =>
  newtypeKDerive<MonadF, $<TaggedF, [S]>>()(Identity.Monad),
) as <S>() => Monad<$<TaggedF, [S]>>;

const taggedBifunctor: Lazy<Bifunctor<TaggedF>> = lazyVal(() =>
  Bifunctor.of({
    bimap_: <A, B, C, D>(tab: Tagged<A, B>, f: (a: A) => C, g: (b: B) => D) =>
      Tagged<C, D>(g(Tagged.unTag(tab))),
  }),
);

const taggedProfunctor: Lazy<Profunctor<TaggedF>> = lazyVal(() =>
  Profunctor.of({
    dimap_: <A, B, C, D>(fab: Tagged<A, B>, f: (c: C) => A, g: (b: B) => D) =>
      Tagged<C, D>(g(Tagged.unTag(fab))),
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
export type TaggedF = KindOf<typeof TaggedF>;
