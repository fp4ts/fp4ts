// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Option, Some } from '@fp4ts/cats';
import { Prism, getOrModify, reverseGet, getOption } from '@fp4ts/optics-core';
import { IsEq } from '@fp4ts/cats-test-kit';

import { OptionalLaws } from './optional-laws';

export const PrismLaws = <S, A>(prism: Prism<S, A>) => ({
  ...OptionalLaws(prism),

  partialRoundTripOneWay: (s: S): IsEq<S> =>
    new IsEq(
      getOrModify(prism)(s).fold(x => x, reverseGet(prism)),
      s,
    ),

  roundTripOtherWay: (a: A): IsEq<Option<A>> =>
    new IsEq(getOption(prism)(reverseGet(prism)(a)), Some(a)),
});
