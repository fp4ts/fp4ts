// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe } from '@fp4ts/core';
import { Traversable } from '@fp4ts/cats-core';
import { Identity } from '@fp4ts/cats-core/lib/data';
import { Traversing } from '@fp4ts/cats-profunctor';
import { IsEq } from '@fp4ts/cats-test-kit';
import { ChoiceLaws } from './choice-laws';
import { StrongLaws } from './strong-laws';

export const TraversingLaws = <P>(P: Traversing<P>) => ({
  ...ChoiceLaws(P),
  ...StrongLaws(P),

  traverseIsWanderTraverse: <F, A, B>(
    F: Traversable<F>,
    pab: Kind<P, [A, B]>,
  ): IsEq<Kind<P, [Kind<F, [A]>, Kind<F, [B]>]>> =>
    new IsEq(
      P.wander_<Kind<F, [A]>, Kind<F, [B]>, A, B>(pab, F.traverse),
      P.traverse_(F, pab),
    ),

  rmapTraverseIsTraverseRmapMap: <F, A, B, C>(
    F: Traversable<F>,
    pab: Kind<P, [A, B]>,
    f: (a: B) => C,
  ) =>
    new IsEq<Kind<P, [Kind<F, [A]>, Kind<F, [C]>]>>(
      pipe(P.rmap_(pab, f), P.traverse(F)),
      pipe(P.traverse_(F, pab), P.rmap(F.map(f))),
    ),

  traverseSequentialComposition: <F, G, A, B>(
    F: Traversable<F>,
    G: Traversable<G>,
    pab: Kind<P, [A, B]>,
  ) =>
    new IsEq(
      pipe(pab, P.traverse(G), P.traverse(F)),
      P.traverse_<[F, G], A, B>(Traversable.compose(F, G), pab),
    ),

  traverseIdentityIsIdentity: <A, B>(pab: Kind<P, [A, B]>) =>
    new IsEq(P.traverse_(Identity.Traversable, pab), pab),
});
