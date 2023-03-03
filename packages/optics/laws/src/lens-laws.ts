// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lens, get, replace } from '@fp4ts/optics-core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { TraversalLaws } from './traversal-laws';

export const LensLaws = <S, A>(lens: Lens<S, A>) => ({
  ...TraversalLaws(lens),

  getReplace: (s: S): IsEq<S> => new IsEq(replace(lens)(get(lens)(s))(s), s),

  replaceGet: (s: S, a: A): IsEq<A> =>
    new IsEq(get(lens)(replace(lens)(a)(s)), a),
});
