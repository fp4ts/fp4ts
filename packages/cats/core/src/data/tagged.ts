// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '@fp4ts/cats-kernel';
import {
  $,
  $type,
  Kind,
  KindOf,
  Lazy,
  lazyVal,
  newtypeK,
  TyK,
  TyVar,
} from '@fp4ts/core';
import { Profunctor } from '../arrow';
import { Bifunctor } from '../bifunctor';
import { EqK } from '../eq-k';
import { Monad } from '../monad';
import { Either } from './either';

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
  EqK.of<$<TaggedF, [S]>>({
    liftEq: <A>(E: Eq<A>) => Eq.by(E, (ta: Tagged<S, A>) => Tagged.unTag(ta)),
  }),
) as <S>() => EqK<$<TaggedF, [S]>>;

const taggedMonad: <S>() => Monad<$<TaggedF, [S]>> = lazyVal(<S>() =>
  Monad.of<$<TaggedF, [S]>>({
    pure: Tagged,
    flatMap_: (fa, f) => f(Tagged.unTag(fa)),
    map_: (fa, f) => Tagged(f(Tagged.unTag(fa))),
    tailRecM_: <R, A>(
      r: R,
      f: (r: R) => Tagged<S, Either<R, A>>,
    ): Tagged<S, A> => {
      let res: Either<R, A> = Tagged.unTag(f(r));
      while (res.isLeft) {
        res = Tagged.unTag(f(res.getLeft));
      }
      return Tagged(res.get);
    },
  }),
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
