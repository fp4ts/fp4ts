// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { newtype, TypeOf } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats';
import { Schema, Schemable } from '@fp4ts/schema';

const _UUID = newtype<string>()('@fp4ts/shopping-cart/common/uuid');

export type UUID = TypeOf<typeof _UUID>;

export const UUID: UUIDObj = function () {};

UUID.unsafeFromString = _UUID;
UUID.toString = _UUID.unapply;
UUID.schema = Schema.string.imap(_UUID, _UUID.unapply);
UUID.Eq = UUID.schema.interpret(Schemable.Eq);
UUID.Ref = _UUID;
interface UUIDObj {
  unsafeFromString(s: string): UUID;
  toString(uuid: UUID): string;
  schema: Schema<UUID>;
  Eq: Eq<UUID>;
  Ref: typeof _UUID;
}
