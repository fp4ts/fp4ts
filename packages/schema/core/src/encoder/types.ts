// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Encoder } from './algebra';

export type TypeOf<E> = E extends Encoder<any, infer A> ? A : unknown;

export type OutputOf<E> = E extends Encoder<infer O, any> ? O : never;
