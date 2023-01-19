// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Codec } from './algebra';

export type TypeOf<C> = C extends Codec<any, any, infer A> ? A : unknown;

export type OutputOf<C> = C extends Codec<any, infer O, any> ? O : never;

export type InputOf<C> = C extends Codec<infer I, any, any> ? I : never;
