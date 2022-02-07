// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Monoid } from '@fp4ts/cats-kernel';

import { Const } from './const';

export const of = <A, B>(a: A): Const<A, B> => a;

export const pure =
  <A>(A: Monoid<A>) =>
  <B>(_: B): Const<A, B> =>
    A.empty;

export const empty = <A>(A: Monoid<A>): Const<A, never> => A.empty;
