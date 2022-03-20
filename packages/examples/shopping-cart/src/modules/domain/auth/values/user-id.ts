// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, newtype, TypeOf } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats';
import { Schema, Schemable } from '@fp4ts/schema';

import { UUID } from '../../../../common';

const _UserId = newtype<UUID>()('@fp4ts/shipping-cart/auth/domain/user-id');

export type UserId = TypeOf<typeof _UserId>;

export const UserId: UserIdObj = function (uuid: UUID) {
  return _UserId(uuid);
};

UserId.unsafeFromString = compose(_UserId, UUID.unsafeFromString);
UserId.toUUID = _UserId.unapply;
UserId.toString = compose(UUID.toString, UserId.toUUID);
UserId.schema = UUID.schema.imap(_UserId, _UserId.unapply);
UserId.Eq = UserId.schema.interpret(Schemable.Eq);

interface UserIdObj {
  (uuid: UUID): UserId;
  unsafeFromString(s: string): UserId;
  toUUID(id: UserId): UUID;
  toString(id: UserId): string;
  schema: Schema<UserId>;
  Eq: Eq<UserId>;
}
