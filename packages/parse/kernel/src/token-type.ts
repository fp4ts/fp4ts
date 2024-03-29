// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export const TokenTypeTag = Symbol('@fp4ts/parse/core/token-type');
export type TokenTypeTag = typeof TokenTypeTag;

export type TokenType<S> = S extends { [TokenTypeTag]: infer T } ? T : never;

export type HasTokenType<T> = { [TokenTypeTag]: T };

declare module '@fp4ts/collections-core/lib/list' {
  interface _List<A> {
    readonly [TokenTypeTag]: A;
  }
}
declare module '@fp4ts/collections-core/lib/lazy-list' {
  interface _LazyList<A> {
    readonly [TokenTypeTag]: A;
  }
}
