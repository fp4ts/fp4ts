// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Applicative, TraversableFilter } from '@fp4ts/cats-core';
import { Identity, Nested, Option, Some } from '@fp4ts/cats-core/lib/data';
import { IsEq } from '@fp4ts/cats-test-kit';
import { FunctorFilterLaws } from './functor-filter-laws';
import { TraversableLaws } from './traversable-laws';

export const TraversableFilterLaws = <F>(F: TraversableFilter<F>) => ({
  ...TraversableLaws(F),
  ...FunctorFilterLaws(F),

  traverseFilterIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(F.traverseFilter_(Identity.Applicative)(fa, Some), fa),

  traverseFilterConsistentWithTraverse:
    <G>(G: Applicative<G>) =>
    <A, B>(
      fa: Kind<F, [A]>,
      f: (a: A) => Kind<G, [B]>,
    ): IsEq<Kind<G, [Kind<F, [B]>]>> =>
      new IsEq(
        F.traverseFilter_(G)(fa, x => G.map_(f(x), Some)),
        F.traverse_(G)(fa, f),
      ),

  traverseFilterConsistentWithMapFilter: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Option<B>,
  ): IsEq<Kind<F, [B]>> =>
    new IsEq(
      F.traverseFilter_(Identity.Applicative)(fa, f),
      F.mapFilter_(fa, f),
    ),

  filterAConsistentWithTraverseFilter:
    <G>(G: Applicative<G>) =>
    <A>(
      fa: Kind<F, [A]>,
      f: (a: A) => Kind<G, [boolean]>,
    ): IsEq<Kind<G, [Kind<F, [A]>]>> =>
      new IsEq(
        F.filterA_(G)(fa, f),
        F.traverseFilter_(G)(fa, x =>
          G.map_(f(x), r => Some(x).filter(() => r)),
        ),
      ),

  traverseFilterSequentialComposition:
    <M, N>(M: Applicative<M>, N: Applicative<N>) =>
    <A, B, C>(
      ta: Kind<F, [A]>,
      f: (a: A) => Kind<M, [Option<B>]>,
      g: (b: B) => Kind<N, [Option<C>]>,
    ): IsEq<Nested<M, N, Kind<F, [C]>>> => {
      const lhs = Nested(
        M.map_(F.traverseFilter_(M)(ta, f), fb => F.traverseFilter_(N)(fb, g)),
      );
      const rhs = F.traverseFilter_(Nested.Applicative(M, N))(ta, a =>
        Nested(M.map_(f(a), x => x.traverseFilter(N)(g))),
      );

      return new IsEq(lhs, rhs);
    },
});
