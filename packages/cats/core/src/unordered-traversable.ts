// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { HKT1, id, Kind } from '@fp4ts/core';
import { Applicative } from './applicative';
import {
  UnorderedFoldable,
  UnorderedFoldableRequirements,
} from './unordered-foldable';

/**
 * @category Type Class
 */
export interface UnorderedTraversable<T> extends UnorderedFoldable<T> {
  readonly unorderedTraverse: <G>(
    G: Applicative<G>,
  ) => <A, B>(
    f: (a: A) => Kind<G, [B]>,
  ) => (fa: Kind<T, [A]>) => Kind<G, [Kind<T, [B]>]>;
  readonly unorderedTraverse_: <G>(
    G: Applicative<G>,
  ) => <A, B>(
    fa: Kind<T, [A]>,
    f: (a: A) => Kind<G, [B]>,
  ) => Kind<G, [Kind<T, [B]>]>;

  readonly unorderedSequence: <G>(
    G: Applicative<G>,
  ) => <A>(fga: Kind<T, [Kind<G, [A]>]>) => Kind<G, [Kind<T, [A]>]>;
}

export type UnorderedTraversableRequirements<T> = Pick<
  UnorderedTraversable<T>,
  'unorderedTraverse_'
> &
  UnorderedFoldableRequirements<T> &
  Partial<UnorderedTraversable<T>>;

function of<T>(T: UnorderedTraversableRequirements<T>): UnorderedTraversable<T>;
function of<T>(
  T: UnorderedTraversableRequirements<HKT1<T>>,
): UnorderedTraversable<HKT1<T>> {
  const self: UnorderedTraversable<HKT1<T>> = {
    unorderedTraverse: G => f => fa => self.unorderedTraverse_(G)(fa, f),

    unorderedSequence: G => fga => self.unorderedTraverse_(G)(fga, id),

    ...UnorderedFoldable.of(T),
    ...T,
  };
  return self;
}

export const UnorderedTraversable = Object.freeze({
  of,
});
