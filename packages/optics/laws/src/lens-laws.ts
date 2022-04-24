// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { Const, Function1, Identity } from '@fp4ts/cats';
import { Lens, asGetting, modify, replace, view } from '@fp4ts/optics-core';
import { IsEq } from '@fp4ts/cats-test-kit';

import { OptionalLaws } from './optional-laws';

export const LensLaws = <S, A>(lens: Lens<S, A>) => ({
  ...OptionalLaws(lens),

  getReplace: (s: S): IsEq<S> =>
    new IsEq(replace(lens)(pipe(lens, asGetting(), view)(s))(s), s),

  replaceGet: (s: S, a: A): IsEq<A> =>
    new IsEq(pipe(lens, asGetting(), view)(replace(lens)(a)(s)), a),

  consistentModifyModifyId: (s: S, a: A): IsEq<S> =>
    new IsEq(
      modify(lens)(() => a)(s),
      lens(Identity.Functor, Function1.ArrowChoice)(() => a)(s),
    ),

  consistentGetModifyId: (s: S): IsEq<A> =>
    new IsEq(
      pipe(lens, asGetting(), view)(s),
      lens(Const.Functor<A>(), Function1.ArrowChoice)(a => a)(s),
    ),
});
