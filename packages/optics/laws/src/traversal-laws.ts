// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Applicative } from '@fp4ts/cats';
import { Traversal, traverse } from '@fp4ts/optics-core';
import { IsEq } from '@fp4ts/cats-test-kit';

import { SetterLaws } from './setter-laws';
import { F1, Kind } from '@fp4ts/core';

export const TraversalLaws = <S, A>(traversal: Traversal<S, A>) => ({
  ...SetterLaws(traversal),

  traversePureId:
    <F>(F: Applicative<F>) =>
    (s: S) =>
      new IsEq(traverse(traversal)(F)(F.pure)(s), F.pure(s)),

  traversalComposition:
    <F, G>(F: Applicative<F>, G: Applicative<G>) =>
    (f: (a: A) => Kind<F, [A]>, g: (a: A) => Kind<G, [A]>, s: S) =>
      new IsEq(
        F.map_(traverse(traversal)(F)(f)(s), traverse(traversal)(G)(g)),
        traverse(traversal)<[F, G]>(Applicative.compose(F, G))(
          F1.andThen(f, F.map(g)),
        )(s),
      ),
});
