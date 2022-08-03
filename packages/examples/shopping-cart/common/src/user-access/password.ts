// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { newtype, TypeOf } from '@fp4ts/core';
import { None, Option, Some } from '@fp4ts/cats';
import { Codec, Decoder, Encoder, Schema } from '@fp4ts/schema';
import { JsonCodec } from '@fp4ts/schema-json';

const Password_ = newtype<string>()('@shopping-cart/common/auth/password');

export type Password = TypeOf<typeof Password_>;
export const Password = function (text: string): Option<Password> {
  return text.trim().length >= 8 ? Some(Password_(text)) : None;
};

Password.toString = Password_.unapply;
Password.unsafeFromString = (p: string) => Password(p).get;
Password.schema = Schema.string.imap(Password_, Password_.unapply);
Password.codec = JsonCodec.fromCodec(
  Codec(
    Schema.string.interpret(Encoder.Schemable).encode,
    Decoder.string.filter(text => text.trim().length >= 8).decode,
  ),
).imap(Password_, Password_.unapply);
