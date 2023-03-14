// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, Kind } from '@fp4ts/core';
import { Apply } from './apply';
import { ComposedApplicative } from './composed';
import { Foldable } from './foldable';
import { FoldableWithIndex } from './foldable-with-index';
import { ArrayF, arrayApplicative } from './instances/array';
import { Traversable } from './traversable';

/**
 * @category Type Class
 */
export interface Applicative<F> extends Apply<F> {
  pure<A>(a: A): Kind<F, [A]>;
  readonly unit: Kind<F, [void]>;

  tupled<A extends unknown[]>(
    ...fsa: { [k in keyof A]: Kind<F, [A[k]]> }
  ): Kind<F, [A]>;

  traverseA<G>(
    G: Foldable<G>,
  ): <A, B>(f: (a: A) => Kind<F, [B]>) => (ta: Kind<G, [A]>) => Kind<F, [void]>;
  traverseA_<G>(
    G: Foldable<G>,
  ): <A, B>(ta: Kind<G, [A]>, f: (a: A) => Kind<F, [B]>) => Kind<F, [void]>;

  traverseWithIndexA<G, I>(
    G: FoldableWithIndex<G, I>,
  ): <A, B>(
    f: (a: A, i: I) => Kind<F, [B]>,
  ) => (ta: Kind<G, [A]>) => Kind<F, [void]>;
  traverseWithIndexA_<G, I>(
    G: FoldableWithIndex<G, I>,
  ): <A, B>(
    ta: Kind<G, [A]>,
    f: (a: A, i: I) => Kind<F, [B]>,
  ) => Kind<F, [void]>;
}

export type ApplicativeRequirements<F> = Pick<Applicative<F>, 'pure'> &
  (Pick<Applicative<F>, 'ap_'> | Pick<Applicative<F>, 'map2_'>) &
  Partial<Applicative<F>>;
export const Applicative = Object.freeze({
  of: <F>(F: ApplicativeRequirements<F>): Applicative<F> => {
    const self: Applicative<F> = {
      unit: F.pure(undefined as void),

      tupled: ((...xs) =>
        Traversable.Array.sequence(self)(xs)) as Applicative<F>['tupled'],

      traverseA: G => f => ta => self.traverseA_(G)(ta, f),
      traverseA_: G => (ta, f) => traverseA(self, G, ta, f),

      traverseWithIndexA: G => f => ta => self.traverseWithIndexA_(G)(ta, f),
      traverseWithIndexA_: G => (ta, f) => traverseWithIndexA(self, G, ta, f),

      ...Apply.of<F>({ map_: (fa, f) => self.ap_(F.pure(f), fa), ...F }),
      ...F,
    };
    return self;
  },

  compose: <F, G>(
    F: Applicative<F>,
    G: Applicative<G>,
  ): ComposedApplicative<F, G> => ComposedApplicative.of(F, G),

  get Array(): Applicative<ArrayF> {
    return arrayApplicative();
  },
});

const discard = () => {};

function traverseA<F, G, A, B>(
  F: Applicative<F>,
  G: Foldable<G>,
  ta: Kind<G, [A]>,
  f: (a: A) => Kind<F, [B]>,
): Kind<F, [void]> {
  return G.foldRight_(ta, Eval.now(F.unit), (x, ac) =>
    F.map2Eval_(f(x), ac, discard),
  ).value;
}

function traverseWithIndexA<F, G, I, A, B>(
  F: Applicative<F>,
  G: FoldableWithIndex<G, I>,
  ta: Kind<G, [A]>,
  f: (a: A, i: I) => Kind<F, [B]>,
): Kind<F, [void]> {
  return G.foldRightWithIndex_(ta, Eval.now(F.unit), (x, ac, i) =>
    F.map2Eval_(f(x, i), ac, discard),
  ).value;
}
