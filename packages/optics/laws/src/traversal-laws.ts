// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Identity, List, Option } from '@fp4ts/cats';
import {
  Traversal,
  headOption,
  toList,
  modify,
  Indexable,
} from '@fp4ts/optics-core';
import { IsEq } from '@fp4ts/cats-test-kit';

import { SetterLaws } from './setter-laws';

export const TraversalLaws = <S, A>(traversal: Traversal<S, A>) => ({
  ...SetterLaws(traversal),

  headOption: (s: S): IsEq<Option<A>> =>
    new IsEq(headOption(traversal)(s), toList(traversal)(s).headOption),

  modifyGetAll: (s: S, f: (a: A) => A): IsEq<List<A>> =>
    new IsEq(
      toList(traversal)(modify(traversal)(f)(s)),
      toList(traversal)(s).map(f),
    ),

  consistentModifyModifyId: (s: S, a: A): IsEq<S> =>
    new IsEq(
      modify(traversal)(() => a)(s),
      traversal(
        Identity.Applicative,
        Indexable.Function1(),
        Indexable.Function1(),
      )(() => a)(s),
    ),
});
