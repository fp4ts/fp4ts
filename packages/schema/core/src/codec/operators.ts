// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Codec } from './algebra';

export const nullable = <O, A>(
  c: Codec<unknown, O, A>,
): Codec<unknown, O | null, A | null> => {
  return new Codec(c.toEncoder.nullable, c.toDecoder.nullable());
};

export const optional = <O, A>(
  c: Codec<unknown, O, A>,
): Codec<unknown, O | undefined, A | undefined> => {
  return new Codec(c.toEncoder.optional, c.toDecoder.optional());
};

export const imap_ = <I, O, A, B>(
  c: Codec<I, O, A>,
  f: (a: A) => B,
  g: (b: B) => A,
): Codec<I, O, B> => {
  return new Codec(c.toEncoder.contramap(g), c.toDecoder.map(f));
};

export const andThen_ = <A, B, C>(
  c1: Codec<A, A, B>,
  c2: Codec<B, B, C>,
): Codec<A, A, C> => {
  return new Codec(
    c1.toEncoder.compose(c2.toEncoder),
    c1.toDecoder.andThen(c2.toDecoder),
  );
};
