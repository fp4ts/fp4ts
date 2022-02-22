// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export const TokenTypeTag = Symbol('@fp4ts/parse/core/token-type');
export type TokenTypeTag = typeof TokenTypeTag;

export type TokenType<S> = S extends { [TokenTypeTag]: infer T } ? T : never;

declare module '@fp4ts/cats-core/lib/data/collections/list/algebra' {
  interface List<A> {
    readonly [TokenTypeTag]: A;
  }
}
