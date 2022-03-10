// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Const, Option, Some } from '@fp4ts/cats';
import { Optional } from '@fp4ts/optics-core';
import { IsEq } from '@fp4ts/cats-test-kit';

import { firstOption } from '@fp4ts/optics-core/lib/internal/monoids';

import { TraversalLaws } from './traversal-laws';

export const OptionalLaws = <S, A>(optional: Optional<S, A>) => ({
  ...TraversalLaws(optional),

  getOptionReplace: (s: S): IsEq<S> =>
    new IsEq(
      optional.getOrModify(s).fold(
        s => s,
        x => optional.replace(x)(s),
      ),
      s,
    ),

  replaceGetOption: (s: S, a: A): IsEq<Option<A>> =>
    new IsEq(
      optional.getOption(optional.replace(a)(s)),
      optional.getOption(s).map(() => a),
    ),

  consistentGetOptionModifyId: (s: S): IsEq<Option<A>> =>
    new IsEq(
      optional.getOption(s),
      optional.modifyA(Const.Applicative(firstOption<A>()))(a => Some(a))(s),
    ),
});
