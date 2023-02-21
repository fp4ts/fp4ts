// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Functor } from '@fp4ts/cats-core';
import { Identity } from '@fp4ts/cats-core/lib/data';
import { Mapping } from '@fp4ts/cats-profunctor';
import { IsEq } from '@fp4ts/cats-test-kit';
import { Kind, pipe } from '@fp4ts/core';
import { ClosedLaws } from './closed-laws';
import { TraversingLaws } from './traversing-laws';

export const MappingLaws = <P>(P: Mapping<P>) => ({
  ...TraversingLaws(P),
  ...ClosedLaws(P),

  mapRmapIsRmapFmapMap: <F, A, B, C>(
    F: Functor<F>,
    pab: Kind<P, [A, B]>,
    f: (b: B) => C,
  ) =>
    new IsEq(
      pipe(P.rmap_(pab, f), P.map(F)),
      pipe(P.map_(F, pab), P.rmap(F.map(f))),
    ),

  mapSequentialComposition: <F, G, A, B>(
    F: Functor<F>,
    G: Functor<G>,
    pab: Kind<P, [A, B]>,
  ) =>
    new IsEq(
      pipe(P.map_(G, pab), P.map(F)),
      pipe(P.map_<[F, G], A, B>(Functor.compose(F, G), pab)),
    ),

  mapIdentity: <A, B>(pab: Kind<P, [A, B]>) =>
    new IsEq(pipe(P.map_(Identity.Monad, pab)), pab),
});
