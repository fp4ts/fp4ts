// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { Const, Identity } from '@fp4ts/cats';
import { Lens, get, modify, replace, Indexable } from '@fp4ts/optics-core';
import { IsEq } from '@fp4ts/cats-test-kit';

export const LensLaws = <S, A>(lens: Lens<S, A>) => ({
  // ...OptionalLaws(lens),

  getReplace: (s: S): IsEq<S> =>
    new IsEq(replace(lens)(pipe(lens, get)(s))(s), s),

  replaceGet: (s: S, a: A): IsEq<A> =>
    new IsEq(pipe(lens, get)(replace(lens)(a)(s)), a),

  consistentModifyModifyId: (s: S, a: A): IsEq<S> =>
    new IsEq(
      modify(lens)(() => a)(s),
      lens(Identity.Functor, Indexable.Function1())(() => a)(s),
    ),

  consistentGetModifyId: (s: S): IsEq<A> =>
    new IsEq(
      pipe(lens, get)(s),
      lens(Const.Functor<A>(), Indexable.Function1())(a => a)(s),
    ),
});
