// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export const ElementTag = Symbol('@fp4ts/http/dsl-shared/ElementTag');
export type ElementTag = typeof ElementTag;

export interface ApiElement<T extends string> {
  [ElementTag]: T;
}
