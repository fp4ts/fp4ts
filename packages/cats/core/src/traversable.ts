// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, id, TyK, $type, TyVar } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { FlatMap } from './flat-map';
import { Applicative } from './applicative';
import { Foldable } from './foldable';
import { Functor } from './functor';
import {
  UnorderedTraversable,
  UnorderedTraversableRequirements,
} from './unordered-traversable';
import { ComposedTraversable } from './composed';
import { Const, Identity } from './data';
import { ArrayF } from './instances/array';
import { TraversableWithIndex } from './traversable-with-index';

/**
 * @category Type Class
 */
export interface Traversable<T>
  extends Functor<T>,
    Foldable<T>,
    UnorderedTraversable<T> {
  readonly traverse: <G>(
    G: Applicative<G>,
  ) => <A, B>(
    f: (a: A) => Kind<G, [B]>,
  ) => (fa: Kind<T, [A]>) => Kind<G, [Kind<T, [B]>]>;
  readonly traverse_: <G>(
    G: Applicative<G>,
  ) => <A, B>(
    fa: Kind<T, [A]>,
    f: (a: A) => Kind<G, [B]>,
  ) => Kind<G, [Kind<T, [B]>]>;

  readonly sequence: <G>(
    G: Applicative<G>,
  ) => <A>(fga: Kind<T, [Kind<G, [A]>]>) => Kind<G, [Kind<T, [A]>]>;

  readonly flatTraverse: <G>(
    F: FlatMap<T>,
    G: Applicative<G>,
  ) => <A, B>(
    f: (a: A) => Kind<G, [Kind<T, [B]>]>,
  ) => (fa: Kind<T, [A]>) => Kind<G, [Kind<T, [B]>]>;
  readonly flatTraverse_: <G>(
    F: FlatMap<T>,
    G: Applicative<G>,
  ) => <A, B>(
    fa: Kind<T, [A]>,
    f: (a: A) => Kind<G, [Kind<T, [B]>]>,
  ) => Kind<G, [Kind<T, [B]>]>;

  readonly flatSequence: <G>(
    F: FlatMap<T>,
    G: Applicative<G>,
  ) => <A>(fgfa: Kind<T, [Kind<G, [Kind<T, [A]>]>]>) => Kind<G, [Kind<T, [A]>]>;
}

export type TraversableRequirements<T> = Pick<Traversable<T>, 'traverse_'> &
  Partial<Traversable<T>> &
  Partial<UnorderedTraversableRequirements<T>>;

export const Traversable = Object.freeze({
  of: <T>(T: TraversableRequirements<T>): Traversable<T> => {
    const self: Traversable<T> = {
      traverse: G => f => fa => self.traverse_(G)(fa, f),

      sequence: G => fga => self.traverse_(G)(fga, id),

      flatTraverse: (F, G) => f => fa => self.flatTraverse_(F, G)(fa, f),
      flatTraverse_: (F, G) => (fa, f) =>
        G.map_(self.traverse_(G)(fa, f), F.flatten),

      flatSequence: (F, G) => fgfa => self.flatTraverse_(F, G)(fgfa, id),

      ...UnorderedTraversable.of({
        unorderedTraverse_: T.unorderedTraverse_ ?? (G => self.traverse_(G)),
        unorderedFoldMap_: T.unorderedFoldMap_ ?? (M => self.foldMap_(M)),
      }),
      ...Foldable.of({
        ...T,
        foldMap_:
          T.foldMap_ ??
          (<M>(M: Monoid<M>) =>
            <A>(fa: Kind<T, [A]>, f: (a: A) => M): M =>
              self.traverse_(Const.Applicative(M))(fa, f)),
      }),
      ...Functor.of({
        map_:
          T.map_ ??
          (<A, B>(fa: Kind<T, [A]>, f: (a: A) => B): Kind<T, [B]> =>
            self.traverse_(Identity.Applicative)(fa, f)),
        ...T,
      }),
      ...T,
    };
    return self;
  },

  compose: <F, G>(
    F: Traversable<F>,
    G: Traversable<G>,
  ): ComposedTraversable<F, G> => ComposedTraversable.of(F, G),

  get Array(): Traversable<ArrayF> {
    return TraversableWithIndex.Array;
  },
});

// -- HKT

export interface TraversableF extends TyK<[unknown]> {
  [$type]: Traversable<TyVar<this, 0>>;
}
