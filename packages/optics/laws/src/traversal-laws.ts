// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Identity, List, Option } from '@fp4ts/cats';
import { Traversal } from '@fp4ts/optics-core';
import { IsEq } from '@fp4ts/cats-test-kit';

import { SetterLaws } from './setter-laws';

export const TraversalLaws = <S, A>(traversal: Traversal<S, A>) => ({
  ...SetterLaws(traversal),

  headOption: (s: S): IsEq<Option<A>> =>
    new IsEq(traversal.headOption(s), traversal.getAll(s).headOption),

  modifyGetAll: (s: S, f: (a: A) => A): IsEq<List<A>> =>
    new IsEq(
      traversal.getAll(traversal.modify(f)(s)),
      traversal.getAll(s).map(f),
    ),

  consistentModifyModifyId: (s: S, a: A): IsEq<S> =>
    new IsEq(
      traversal.modify(() => a)(s),
      traversal.modifyA(Identity.Applicative)(() => a)(s),
    ),
});
