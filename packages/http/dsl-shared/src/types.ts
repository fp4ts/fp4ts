// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Schema } from '@fp4ts/schema-kernel';
import { typeDef } from './type';

export const booleanType = typeDef('@fp4ts/http/dsl/boolean', Schema.boolean);
export type booleanType = typeof booleanType;
export const numberType = typeDef('@fp4ts/http/dsl/number', Schema.number);
export type numberType = typeof numberType;
export const stringType = typeDef('@fp4ts/http/dsl/string', Schema.string);
export type stringType = typeof stringType;
export const nullType = typeDef('@fp4ts/http/dsl/null', Schema.null);
export type nullType = typeof nullType;
