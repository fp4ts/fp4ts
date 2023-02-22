// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Compose } from '@fp4ts/cats-arrow';
import { IsEq } from '@fp4ts/cats-test-kit';

export const ComposeLaws = <P>(P: Compose<P>) => ({
  composeAssociativity: <A, B, C, D>(
    f: Kind<P, [A, B]>,
    g: Kind<P, [B, C]>,
    h: Kind<P, [C, D]>,
  ): IsEq<Kind<P, [A, D]>> =>
    new IsEq(P.andThen_(f, P.andThen_(g, h)), P.andThen_(P.andThen_(f, g), h)),

  composeIsAndThen: <A, B, C>(
    f: Kind<P, [A, B]>,
    g: Kind<P, [B, C]>,
  ): IsEq<Kind<P, [A, C]>> => new IsEq(P.andThen_(f, g), P.compose_(g, f)),
});
