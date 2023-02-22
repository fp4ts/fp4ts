// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Category } from '@fp4ts/cats-arrow';
import { IsEq } from '@fp4ts/cats-test-kit';
import { ComposeLaws } from './compose-laws';

export const CategoryLaws = <P>(P: Category<P>) => ({
  ...ComposeLaws(P),

  categoryLeftIdentity: <A, B>(f: Kind<P, [A, B]>): IsEq<Kind<P, [A, B]>> =>
    new IsEq(P.compose_(P.id(), f), f),

  categoryRightIdentity: <A, B>(f: Kind<P, [A, B]>): IsEq<Kind<P, [A, B]>> =>
    new IsEq(P.compose_(f, P.id()), f),
});
