// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Option, Some } from '@fp4ts/cats';
import { Prism } from '@fp4ts/optics-core';
import { IsEq } from '@fp4ts/cats-test-kit';

import { OptionalLaws } from './optional-laws';

export const PrismLaws = <S, A>(prism: Prism<S, A>) => ({
  ...OptionalLaws(prism),

  partialRoundTripOneWay: (s: S): IsEq<S> =>
    new IsEq(
      prism.getOrModify(s).fold(x => x, prism.reverseGet),
      s,
    ),

  roundTripOtherWay: (a: A): IsEq<Option<A>> =>
    new IsEq(prism.getOption(prism.reverseGet(a)), Some(a)),
});
