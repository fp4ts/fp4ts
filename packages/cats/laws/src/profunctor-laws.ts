// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, id, Kind, pipe } from '@fp4ts/core';
import { Profunctor } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';

export const ProfunctorLaws = <F>(F: Profunctor<F>) => ({
  profunctorIdentity: <A, B>(fab: Kind<F, [A, B]>): IsEq<Kind<F, [A, B]>> =>
    new IsEq(F.dimap_(fab, id, id), fab),

  profunctorComposition: <A2, A1, A0, B0, B1, B2>(
    fab: Kind<F, [A0, B0]>,
    f2: (a: A2) => A1,
    f1: (a: A1) => A0,
    g1: (b: B0) => B1,
    g2: (b: B1) => B2,
  ): IsEq<Kind<F, [A2, B2]>> =>
    new IsEq(
      pipe(fab, F.dimap(f1, g1), F.dimap(f2, g2)),
      F.dimap_(fab, compose(f1, f2), compose(g2, g1)),
    ),

  profunctorLmapIdentity: <A, B>(fab: Kind<F, [A, B]>): IsEq<Kind<F, [A, B]>> =>
    new IsEq(F.lmap_(fab, id), fab),

  profunctorRmapIdentity: <A, B>(fab: Kind<F, [A, B]>): IsEq<Kind<F, [A, B]>> =>
    new IsEq(F.rmap_(fab, id), fab),

  profunctorLmapComposition: <A2, A1, A0, B>(
    fab: Kind<F, [A0, B]>,
    f2: (a: A2) => A1,
    f1: (a: A1) => A0,
  ): IsEq<Kind<F, [A2, B]>> =>
    new IsEq(pipe(fab, F.lmap(f1), F.lmap(f2)), F.lmap_(fab, compose(f1, f2))),

  profunctorRmapComposition: <A, B0, B2, B1>(
    fab: Kind<F, [A, B0]>,
    g1: (b: B0) => B1,
    g2: (b: B1) => B2,
  ): IsEq<Kind<F, [A, B2]>> =>
    new IsEq(pipe(fab, F.rmap(g1), F.rmap(g2)), F.rmap_(fab, compose(g2, g1))),
});
