// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { Align } from '../align';
import { Alternative } from '../alternative';
import { Applicative } from '../applicative';
import { Comonad } from '../comonad';
import { FlatMap } from '../flat-map';
import { Foldable } from '../foldable';
import { Functor } from '../functor';
import { FunctorFilter } from '../functor-filter';
import { Monad } from '../monad';
import { MonoidK } from '../monoid-k';
import { SemigroupK } from '../semigroup-k';
import { Traversable } from '../traversable';
import { UnorderedFoldable } from '../unordered-foldable';
import { UnorderedTraversable } from '../unordered-traversable';

export type IdentityT<F, A> = Kind<F, [A]>;

export const IdentityT: IdentityObj = function <F, A>(
  fa: Kind<F, [A]>,
): IdentityT<F, A> {
  return fa;
};

interface IdentityObj {
  <F, A>(fa: Kind<F, [A]>): IdentityT<F, A>;

  SemigroupK<F>(F: SemigroupK<F>): SemigroupK<$<IdentityTF, [F]>>;
  MonoidK<F>(F: MonoidK<F>): MonoidK<$<IdentityTF, [F]>>;
  Align<F>(F: Align<F>): Align<$<IdentityTF, [F]>>;
  Functor<F>(F: Functor<F>): Functor<$<IdentityTF, [F]>>;
  FunctorFilter<F>(F: FunctorFilter<F>): FunctorFilter<$<IdentityTF, [F]>>;
  FlatMap<F>(F: FlatMap<F>): FlatMap<$<IdentityTF, [F]>>;
  Alternative<F>(F: Alternative<F>): Alternative<$<IdentityTF, [F]>>;
  Applicative<F>(F: Applicative<F>): Applicative<$<IdentityTF, [F]>>;
  Monad<F>(F: Monad<F>): Monad<$<IdentityTF, [F]>>;
  Comonad<F>(F: Comonad<F>): Comonad<$<IdentityTF, [F]>>;
  UnorderedFoldable<F>(
    F: UnorderedFoldable<F>,
  ): UnorderedFoldable<$<IdentityTF, [F]>>;
  UnorderedTraversable<F>(
    F: UnorderedTraversable<F>,
  ): UnorderedTraversable<$<IdentityTF, [F]>>;
  Foldable<F>(F: Foldable<F>): Foldable<$<IdentityTF, [F]>>;
  Traversable<F>(F: Traversable<F>): Traversable<$<IdentityTF, [F]>>;
}

IdentityT.SemigroupK = F => F as any;
IdentityT.MonoidK = F => F as any;
IdentityT.Align = F => F as any;
IdentityT.Functor = F => F as any;
IdentityT.FunctorFilter = F => F as any;
IdentityT.FlatMap = F => F as any;
IdentityT.Alternative = F => F as any;
IdentityT.Applicative = F => F as any;
IdentityT.Monad = F => F as any;
IdentityT.Comonad = F => F as any;
IdentityT.UnorderedFoldable = F => F as any;
IdentityT.UnorderedTraversable = F => F as any;
IdentityT.Foldable = F => F as any;
IdentityT.Traversable = F => F as any;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface IdentityTF extends TyK<[unknown, unknown]> {
  [$type]: IdentityT<TyVar<this, 0>, TyVar<this, 1>>;
}
