// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lens } from '@fp4ts/optics-core';
import { IsEq } from '@fp4ts/cats-test-kit';

import { OptionalLaws } from './optional-laws';
import { Const, Identity } from '@fp4ts/cats';

export const LensLaws = <S, A>(lens: Lens<S, A>) => ({
  ...OptionalLaws(lens),

  getReplace: (s: S): IsEq<S> => new IsEq(lens.replace(lens.get(s))(s), s),

  replaceGet: (s: S, a: A): IsEq<A> =>
    new IsEq(lens.get(lens.replace(a)(s)), a),

  consistentModifyModifyId: (s: S, a: A): IsEq<S> =>
    new IsEq(
      lens.modify(() => a)(s),
      lens.modifyF(Identity.Functor)(() => a)(s),
    ),

  consistentGetModifyId: (s: S): IsEq<A> =>
    new IsEq(lens.get(s), lens.modifyF(Const.Functor<A>())(a => a)(s)),
});
