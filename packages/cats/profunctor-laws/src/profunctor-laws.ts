// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { F1, id, Kind, pipe } from '@fp4ts/core';
import { Profunctor } from '@fp4ts/cats-profunctor';
import { IsEq } from '@fp4ts/cats-test-kit';

export const ProfunctorLaws = <P>(P: Profunctor<P>) => ({
  profunctorIdentity: <A, B>(fab: Kind<P, [A, B]>): IsEq<Kind<P, [A, B]>> =>
    new IsEq(P.dimap_(fab, id, id), fab),

  profunctorComposition: <A2, A1, A0, B0, B1, B2>(
    fab: Kind<P, [A0, B0]>,
    f2: (a: A2) => A1,
    f1: (a: A1) => A0,
    g1: (b: B0) => B1,
    g2: (b: B1) => B2,
  ): IsEq<Kind<P, [A2, B2]>> =>
    new IsEq(
      pipe(fab, P.dimap(f1, g1), P.dimap(f2, g2)),
      P.dimap_(fab, F1.compose(f1, f2), F1.compose(g2, g1)),
    ),

  profunctorLmapIdentity: <A, B>(fab: Kind<P, [A, B]>): IsEq<Kind<P, [A, B]>> =>
    new IsEq(P.lmap_(fab, id), fab),

  profunctorRmapIdentity: <A, B>(fab: Kind<P, [A, B]>): IsEq<Kind<P, [A, B]>> =>
    new IsEq(P.rmap_(fab, id), fab),

  profunctorLmapComposition: <A2, A1, A0, B>(
    fab: Kind<P, [A0, B]>,
    f2: (a: A2) => A1,
    f1: (a: A1) => A0,
  ): IsEq<Kind<P, [A2, B]>> =>
    new IsEq(
      pipe(fab, P.lmap(f1), P.lmap(f2)),
      P.lmap_(fab, F1.compose(f1, f2)),
    ),

  profunctorRmapComposition: <A, B0, B2, B1>(
    fab: Kind<P, [A, B0]>,
    g1: (b: B0) => B1,
    g2: (b: B1) => B2,
  ): IsEq<Kind<P, [A, B2]>> =>
    new IsEq(
      pipe(fab, P.rmap(g1), P.rmap(g2)),
      P.rmap_(fab, F1.compose(g2, g1)),
    ),
});
