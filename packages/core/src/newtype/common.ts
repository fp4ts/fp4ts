// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { typeref, TypeOf } from './type-ref';

export const booleanType = typeref<boolean>()('@fp4ts/core/boolean');
export type booleanType = TypeOf<typeof booleanType>;

export const numberType = typeref<number>()('@fp4ts/core/number');
export type numberType = TypeOf<typeof numberType>;

export const stringType = typeref<string>()('@fp4ts/core/string');
export type stringType = TypeOf<typeof stringType>;

export const nullType = typeref<null>()('@fp4ts/core/null');
export type nullType = TypeOf<typeof nullType>;

export const voidType = typeref<void>()('@fp4ts/core/void');
export type voidType = TypeOf<typeof voidType>;
