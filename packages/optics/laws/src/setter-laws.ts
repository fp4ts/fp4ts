// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose } from '@fp4ts/core';
import { Setter } from '@fp4ts/optics-core';
import { IsEq } from '@fp4ts/cats-test-kit';

export const SetterLaws = <S, A>(setter: Setter<S, A>) => ({
  replaceIdempotent: (s: S, a: A): IsEq<S> =>
    new IsEq(setter.replace(a)(setter.replace(a)(s)), setter.replace(a)(s)),

  modifyIdentity: (s: S): IsEq<S> => new IsEq(setter.modify(a => a)(s), s),

  composeModify: (s: S, f: (a: A) => A, g: (a: A) => A): IsEq<S> =>
    new IsEq(
      setter.modify(g)(setter.modify(f)(s)),
      setter.modify(compose(g, f))(s),
    ),

  consistentReplaceModify: (s: S, a: A): IsEq<S> =>
    new IsEq(setter.modify(() => a)(s), setter.replace(a)(s)),
});
