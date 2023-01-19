// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either } from '../either';
import { Option, Some, None } from '../option';

import { Both, Ior, Left, Right } from './algebra';

export const left = <A>(a: A): Ior<A, never> => new Left(a);

export const right = <B>(b: B): Ior<never, B> => new Right(b);

export const both = <A, B>(a: A, b: B): Ior<A, B> => new Both(a, b);

export const fromEither = <A, B>(ea: Either<A, B>): Ior<A, B> =>
  ea.fold(left, right);

export const fromOptions = <A, B>(
  lhs: Option<A>,
  rhs: Option<B>,
): Option<Ior<A, B>> =>
  lhs.fold(
    () =>
      rhs.fold(
        () => None,
        b => Some(right(b)),
      ),
    a =>
      rhs.fold(
        () => Some(left(a)),
        b => Some(both(a, b)),
      ),
  );
