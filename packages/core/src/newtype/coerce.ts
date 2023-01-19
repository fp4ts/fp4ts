// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Newtype } from './newtype';

export function coerce<B>(a: Newtype<any, B>): B;
export function coerce<B extends Newtype<any, any>>(a: B['_A']): B;
export function coerce<B extends Newtype<any, any>>(
  a: Newtype<any, B['_A']>,
): B;
export function coerce<A, B extends A>(a: A): B;
export function coerce<A extends B, B>(a: A): B;
export function coerce<A, _>(a: A): A;
export function coerce<A>(a: A): A {
  return a;
}

export function unsafeCoerce<A, B>(a: A): B;
export function unsafeCoerce<A>(a: A): A {
  return a;
}
