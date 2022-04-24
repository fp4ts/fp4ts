// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Const, Function1, Option, Some } from '@fp4ts/cats';
import { IsEq } from '@fp4ts/cats-test-kit';

import {
  Optional,
  getOrModify,
  replace,
  getOption,
} from '@fp4ts/optics-core/lib/profunctor';
import { firstOption } from '@fp4ts/optics-core/lib/internal/monoids';

import { TraversalLaws } from './traversal-laws';

export const OptionalLaws = <S, A>(optional: Optional<S, A>) => ({
  ...TraversalLaws(optional),

  getOptionReplace: (s: S): IsEq<S> =>
    new IsEq(
      getOrModify(optional)(s).fold(
        s => s,
        x => replace(optional)(x)(s),
      ),
      s,
    ),

  replaceGetOption: (s: S, a: A): IsEq<Option<A>> =>
    new IsEq(
      getOption(optional)(replace(optional)(a)(s)),
      getOption(optional)(s).map(() => a),
    ),

  consistentGetOptionModifyId: (s: S): IsEq<Option<A>> =>
    new IsEq(
      getOption(optional)(s),
      optional(
        Const.Applicative(firstOption<A>()),
        Function1.ArrowChoice,
      )(a => Some(a))(s),
    ),
});
