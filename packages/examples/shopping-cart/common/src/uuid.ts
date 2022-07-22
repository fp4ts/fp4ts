// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { v4 } from 'uuid';
import { Kind, newtype, TypeOf } from '@fp4ts/core';
import { None, Option, Some } from '@fp4ts/cats';
import { IO, IOF } from '@fp4ts/effect';
import { Schema, Codec, Encoder, Decoder } from '@fp4ts/schema';
import { JsonCodec } from '@fp4ts/schema-json';

const UUID_ = newtype<string>()('@shopping-cart/common/uuid');

export type UUID = TypeOf<typeof UUID_>;
export const UUID = function (text: string): Option<UUID> {
  return regex.test(text) ? Some(UUID_(text)) : None;
};

UUID.toString = UUID_.unapply;
UUID.schema = Schema.string.imap(UUID_, UUID.apply);
UUID.codec = JsonCodec.fromCodec(
  Codec(
    Schema.string.interpret(Encoder.Schemable).encode,
    Decoder.string.filter(text => regex.test(text), 'Malformed UUID').decode,
  ).imap(UUID_, UUID_.unapply),
);

export interface GenUUID<F> {
  genUUID(): Kind<F, [UUID]>;
}
export const GenUUID = Object.freeze({
  IO: {
    genUUID: (): IO<UUID> => IO.delay(() => UUID_(v4())),
  } as GenUUID<IOF>,
});

// ref: https://stackoverflow.com/a/6640851
const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
