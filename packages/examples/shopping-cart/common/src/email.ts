// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { newtype, TypeOf } from '@fp4ts/core';
import { None, Option, Some } from '@fp4ts/cats';
import { Codec, Decoder, Encoder, Schema } from '@fp4ts/schema';
import { JsonCodec } from '@fp4ts/schema-json';

export const Email_ = newtype<string>()('@shopping-cart/common/email');

export type Email = TypeOf<typeof Email_>;
export const Email = function (text: string): Option<Email> {
  return regex.test(text) ? Some(Email_(text)) : None;
};

Email.toString = Email_.unapply;
Email.schema = Schema.string.imap(Email_, Email_.unapply);
Email.codec = JsonCodec.fromCodec(
  Codec(
    Schema.string.interpret(Encoder.Schemable).encode,
    Decoder.string.filter(text => regex.test(text), 'Malformed email').decode,
  ),
);

// ref: https://www.emailregex.com/
const regex =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
