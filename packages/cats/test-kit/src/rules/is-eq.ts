// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export class IsEq<A> {
  public constructor(public readonly lhs: A, public readonly rhs: A) {}
}
