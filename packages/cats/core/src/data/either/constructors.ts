// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Left, Right } from './algebra';

export const right = <A, E = never>(a: A): Either<E, A> => new Right(a);

export const pure: <A, E = never>(a: A) => Either<E, A> = right;

export const left = <E, A = never>(e: E): Either<E, A> => new Left(e);

export const rightUnit: Either<never, void> = pure(undefined);
