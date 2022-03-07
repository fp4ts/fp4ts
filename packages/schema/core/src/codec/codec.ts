// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, TyK, TyVar } from '@fp4ts/core';
import { EvalF, Invariant } from '@fp4ts/cats';
import { Schemable } from '@fp4ts/schema-kernel';
import { Encoder } from '../encoder';
import { Decoder, DecodeResultT } from '../decoder-t';
import { Codec as CodecBase } from './algebra';
import { fromDecoder, make } from './constructors';
import { codecInvariant, codecSchemable } from './instances';

export type Codec<I, O, A> = CodecBase<I, O, A>;

export const Codec: CodecObj = function <I, O, A>(
  encode: (a: A) => O,
  decode: (i: I) => DecodeResultT<EvalF, A>,
) {
  return new CodecBase(Encoder(encode), Decoder(decode));
} as any;

interface CodecObj {
  <I, O, A>(
    encode: (a: A) => O,
    decode: (i: I) => DecodeResultT<EvalF, A>,
  ): Codec<I, O, A>;

  make<I, O, A>(encoder: Encoder<O, A>, decoder: Decoder<I, A>): Codec<I, O, A>;
  fromDecoder<I, A>(decoder: Decoder<I, A>): Codec<I, A, A>;

  // -- Instances

  Invariant<I, O>(): Invariant<$<CodecF, [I, O]>>;
  Schemable: Schemable<$<CodecF, [unknown, unknown]>>;
}

Codec.make = make;
Codec.fromDecoder = fromDecoder;

Object.defineProperty(Codec, 'Invariant', {
  get() {
    return codecInvariant();
  },
});
Object.defineProperty(Codec, 'Schemable', {
  get() {
    return codecSchemable();
  },
});

// -- HKT

export interface CodecF extends TyK<[unknown, unknown, unknown]> {
  [$type]: Codec<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
