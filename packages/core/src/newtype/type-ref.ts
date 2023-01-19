// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export interface TypeRef<Ref extends string, A> {
  readonly Ref: Ref;
  readonly _A: A;
}

export function typeref<A>(): <Ref extends string>(
  Ref: Ref,
) => TypeRef<Ref, A> {
  return function <Ref extends string>(Ref: Ref): TypeRef<Ref, A> {
    return { Ref } as TypeRef<Ref, A>;
  };
}

export type TypeOf<T> = [T] extends [TypeRef<any, infer A>] ? A : never;
