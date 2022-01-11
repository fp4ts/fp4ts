// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, EitherT, Identity, Try } from '@fp4ts/cats';
import { MessageFailure, ParsingFailure } from '@fp4ts/http-core';
import { DecoderT, Encoder, Schema, DecodeFailure } from '@fp4ts/schema';

export interface Codable<A> {
  encode: (a: A) => string;
  decode: (a: string) => Either<MessageFailure, A>;
}

export const Codable = Object.freeze({
  json: {
    fromSchema<A>(sa: Schema<A>): Codable<A> {
      const decoder = DecoderT.string(Identity.Monad)
        .andThen(Identity.Monad)(
          DecoderT(s =>
            EitherT(
              Try(() => JSON.parse(s)).toEither.leftMap(
                e => new DecodeFailure(e.message),
              ),
            ),
          ),
        )
        .andThen(Identity.Monad)(
        sa.interpret(DecoderT.Schemable(Identity.Monad)),
      );
      const encoder = sa
        .interpret(Encoder.Schemable)
        .map(a => JSON.stringify(a));

      return {
        encode: a => encoder.encode(a),
        decode: s =>
          decoder.decode(s).value.leftMap(f => new ParsingFailure(f.message)),
      };
    },
  },
});
