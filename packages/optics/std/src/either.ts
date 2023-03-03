// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Left, Right } from '@fp4ts/cats';
import { PPrism, prism, Prism } from '@fp4ts/optics-core';

export function _Left<A, C, B>(): PPrism<Either<A, C>, Either<B, C>, A, B>;
export function _Left<A, C>(): Prism<Either<A, C>, A>;
export function _Left<A, C>(): Prism<Either<A, C>, A> {
  return prism(ac => (ac.isLeft() ? ac.swapped : Left(ac)), Left);
}

export function _Right<A, C, B>(): PPrism<Either<C, A>, Either<C, B>, A, B>;
export function _Right<A, C>(): Prism<Either<C, A>, A>;
export function _Right<A, C>(): Prism<Either<C, A>, A> {
  return prism(ca => (ca.isRight() ? ca : Left(ca)), Right);
}
