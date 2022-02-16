// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { SchemaK } from '@fp4ts/schema-kernel';

export type AndString<A> = [A, string];
export const AndString = Object.freeze({
  schemaK: SchemaK.product(SchemaK.par, SchemaK.string),
  arb<A>(arbA: Arbitrary<A>): Arbitrary<AndString<A>> {
    return fc.tuple(arbA, fc.string());
  },
});
