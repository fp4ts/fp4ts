// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Representable } from '@fp4ts/cats-profunctor';
import { IsEq } from '@fp4ts/cats-test-kit';
import { Kind, pipe } from '@fp4ts/core';
import { StrongLaws } from './strong-laws';

export const RepresentableLaws = <P, F>(P: Representable<P, F>) => ({
  ...StrongLaws(P),

  tabulateSieveIsIdentity: <A, B>(f: (a: A) => Kind<F, [B]>) =>
    new IsEq<(a: A) => Kind<F, [B]>>(pipe(f, P.tabulate, P.sieve), f),

  sieveTabulateIsIdentity: <A, B>(pab: Kind<P, [A, B]>) =>
    new IsEq<Kind<P, [A, B]>>(pipe(pab, P.sieve, P.tabulate), pab),
});
