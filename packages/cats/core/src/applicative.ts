// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Functor } from './functor';
import { Apply } from './apply';
import { CoflatMap } from './coflat-map';
import { ComposedApplicative } from './composed';
import { Array } from './data';
import { Foldable } from './foldable';
import { FoldableWithIndex } from './foldable-with-index';

/**
 * @category Type Class
 */
export interface Applicative<F> extends Apply<F> {
  readonly pure: <A>(a: A) => Kind<F, [A]>;
  readonly unit: Kind<F, [void]>;

  readonly tupled: <A extends unknown[]>(
    ...fsa: { [k in keyof A]: Kind<F, [A[k]]> }
  ) => Kind<F, [A]>;

  traverseA<T>(
    T: Foldable<T>,
  ): <A, B>(f: (a: A) => Kind<F, [B]>) => (ta: Kind<T, [A]>) => Kind<F, [void]>;
  traverseA_<T>(
    T: Foldable<T>,
  ): <A, B>(ta: Kind<T, [A]>, f: (a: A) => Kind<F, [B]>) => Kind<F, [void]>;

  traverseWithIndexA<T, I>(
    T: FoldableWithIndex<T, I>,
  ): <A, B>(
    f: (a: A, i: I) => Kind<F, [B]>,
  ) => (ta: Kind<T, [A]>) => Kind<F, [void]>;
  traverseWithIndexA_<T, I>(
    T: FoldableWithIndex<T, I>,
  ): <A, B>(
    ta: Kind<T, [A]>,
    f: (a: A, i: I) => Kind<F, [B]>,
  ) => Kind<F, [void]>;
}

export type ApplicativeRequirements<F> = Pick<Applicative<F>, 'pure' | 'ap_'> &
  Partial<Applicative<F>>;
export const Applicative = Object.freeze({
  of: <F>(F: ApplicativeRequirements<F>): Applicative<F> => {
    const self: Applicative<F> = {
      unit: F.pure(undefined as void),

      tupled: ((...xs) =>
        Array.TraversableWithIndex().sequence(self)(
          xs,
        )) as Applicative<F>['tupled'],

      traverseA: T => f => ta => self.traverseA_(T)(ta, f),
      traverseA_: T => (ta, f) =>
        T.foldLeft_(ta, self.pure(undefined), (ac, x) =>
          self.productL_(ac, f(x)),
        ),

      traverseWithIndexA: T => f => ta => self.traverseWithIndexA_(T)(ta, f),
      traverseWithIndexA_: T => (ta, f) =>
        T.foldLeftWithIndex_(ta, self.pure(undefined), (ac, x, i) =>
          self.productL_(ac, f(x, i)),
        ),

      ...Apply.of<F>({ ...Applicative.functor<F>(F), ...F }),
      ...F,
    };
    return self;
  },

  compose: <F, G>(
    F: Applicative<F>,
    G: Applicative<G>,
  ): ComposedApplicative<F, G> => ComposedApplicative.of(F, G),

  functor: <F>(F: ApplicativeRequirements<F>): Functor<F> =>
    Functor.of<F>({
      map_: (fa, f) => F.ap_(F.pure(f), fa),
      ...F,
    }),

  coflatMap: <F>(F: Applicative<F>): CoflatMap<F> =>
    CoflatMap.of({ ...F, coflatMap_: (fa, f) => F.pure(f(fa)) }),
});
