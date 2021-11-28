// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export const empty: Array<never> = [];

export const pure: <A>(a: A) => Array<A> = x => [x];

export const of: <A>(...xs: A[]) => A[] = (...xs) => xs;
