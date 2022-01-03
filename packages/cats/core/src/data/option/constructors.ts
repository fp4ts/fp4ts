// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either } from '../either';
import { None, Option, Some } from './algebra';

export const some = <A>(a: A): Option<A> => new Some(a);

export const pure = some;

export const none: Option<never> = None;

export const fromEither = <A>(ea: Either<unknown, A>): Option<A> =>
  ea.fold(() => none, some);

export const fromNullable = <A>(x?: A | null | undefined): Option<A> =>
  x != null ? some(x) : none;
