// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Iso, reverseGet, get } from '@fp4ts/optics-core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { LensLaws } from './lens-laws';
import { PrismLaws } from './prism-laws';

export const IsoLaws = <S, A>(iso: Iso<S, A>) => ({
  ...LensLaws(iso),
  ...PrismLaws(iso),

  reverseGetGet: (s: S): IsEq<S> => new IsEq(reverseGet(iso)(get(iso)(s)), s),

  getReverseGet: (a: A): IsEq<A> => new IsEq(get(iso)(reverseGet(iso)(a)), a),
});
