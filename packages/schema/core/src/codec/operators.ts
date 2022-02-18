// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Option } from '@fp4ts/cats';
import { Encoder } from '../encoder';
import { Decoder } from '../decoder-t';
import { Codec, Codec0 } from './algebra';

export const toEncoder = <I, O, A>(codec: Codec<I, O, A>): Encoder<O, A> =>
  (codec as Codec0<I, O, A>).encoder;

export const toDecoder = <I, O, A>(codec: Codec<I, O, A>): Decoder<I, A> =>
  (codec as Codec0<I, O, A>).decoder;

export const optional = <O, A>(
  c: Codec<unknown, O, A>,
): Codec<unknown, Option<O>, Option<A>> => {
  const c0 = c as Codec0<unknown, O, A>;
  return new Codec0(c0.encoder.optional, c0.decoder.optional());
};

export const nullable = <O, A>(
  c: Codec<unknown, O, A>,
): Codec<unknown, O | null, A | null> => {
  const c0 = c as Codec0<unknown, O, A>;
  return new Codec0(c0.encoder.nullable, c0.decoder.nullable());
};

export const imap_ = <I, O, A, B>(
  c: Codec<I, O, A>,
  f: (a: A) => B,
  g: (b: B) => A,
): Codec<I, O, B> => {
  const c0 = c as Codec0<I, O, A>;
  return new Codec0(c0.encoder.contramap(g), c0.decoder.map(f));
};
