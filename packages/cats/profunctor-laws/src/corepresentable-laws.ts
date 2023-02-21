// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Corepresentable } from '@fp4ts/cats-profunctor';
import { IsEq } from '@fp4ts/cats-test-kit';
import { Kind, pipe } from '@fp4ts/core';
import { CostrongLaws } from './costrong-laws';

export const CorepresentableLaws = <P, F>(P: Corepresentable<P, F>) => ({
  ...CostrongLaws(P),

  cotabulateCosieveIsIdentity: <A, B>(f: (a: Kind<F, [A]>) => B) =>
    new IsEq(pipe(f, P.cotabulate, P.cosieve), f),

  cosieveCotabulateIsIdentity: <A, B>(pab: Kind<P, [A, B]>) =>
    new IsEq(pipe(pab, P.cosieve, P.cotabulate), pab),
});
