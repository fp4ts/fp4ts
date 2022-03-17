// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, TyK, TyVar } from '@fp4ts/core';
import { Either, EitherT, Eval, Try } from '@fp4ts/cats';
import { Schema, DecodeFailure, Codec } from '@fp4ts/schema';

export interface Codable<A> {
  encode: (a: A) => string;
  decode: (a: string) => Either<DecodeFailure, A>;
}

const JsonCodec = Codec<string, string, unknown>(
  x => JSON.stringify(x),
  str =>
    EitherT(
      Eval.delay(() =>
        Try(() => JSON.parse(str)).toEither.leftMap(
          e => new DecodeFailure(e.message),
        ),
      ),
    ),
);

export const Codable = Object.freeze({
  json: {
    fromSchema<A>(sa: Schema<A>): Codable<A> {
      const codec = sa.interpret(Codec.Schemable);
      const res = JsonCodec.andThen(codec);

      return {
        encode: res.encode,
        decode: s => res.decode(s).value.value,
      };
    },
  },
});

export interface CodableF extends TyK<[unknown]> {
  [$type]: Codable<TyVar<this, 0>>;
}
