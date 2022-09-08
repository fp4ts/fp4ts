// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { TypeRef } from './type-ref';

export function coerce<B>(): <A>(i: A) => Coerce<A, B> {
  return coerce_;
}
export function coerce_<A, B>(_: A): Coerce<A, B> {
  return _ as any;
}

// prettier-ignore
type Coerce<A, B> =
  [Unpack<A>, Unpack<B>] extends [infer X, infer Y]
    ? X extends Y ? Y extends X ? B : never : never
    : never;

// prettier-ignore
type Unpack<A> =
    A extends TypeRef<any, infer A>
    ? Unpack<A>
  : A extends (...args: infer AS extends unknown[]) => infer R
    ? (...args: Unpack<AS>) => Unpack<R>
  : { [k in keyof A]: Unpack<A[k]> };

// type X = Coerce<42, TypeRef<'string', number>>;
// type Y = Coerce<TypeRef<'number', number>, TypeRef<'string', number>>;
// type Z = Coerce<'', TypeRef<'string', number>>;

// type W = Coerce<
//   (x: number) => number,
//   (x: TypeRef<'string', number>) => TypeRef<'x', number>
// >;
// type X1 = Coerce<
//   [(x: number) => number, TypeRef<'aa', number>],
//   [(x: TypeRef<'string', number>) => TypeRef<'x', number>, number]
// >;

// type A = ['a'] extends ['a' | 'b'] ? true : false;
// type B = ['a' | 'b'] extends ['a'] ? true : false;
