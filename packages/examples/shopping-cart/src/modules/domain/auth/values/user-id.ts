// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '@fp4ts/cats';
import { compose, newtype, TypeOf } from '@fp4ts/core';
import { Schema, Schemable } from '@fp4ts/schema';

import { UUID } from '../../../../common';

const _UserId = newtype<UUID>()('@fp4ts/shipping-cart/auth/domain/user-id');

export type UserId = TypeOf<typeof _UserId>;

export const UserId: UserIdObj = function (uuid: UUID) {
  return _UserId(uuid);
};

UserId.unsafeFromString = compose(_UserId, UUID.unsafeFromString);
UserId.schema = UUID.schema.imap(_UserId, _UserId.unapply);
UserId.Eq = UserId.schema.interpret(Schemable.Eq);

interface UserIdObj {
  (uuid: UUID): UserId;
  unsafeFromString(s: string): UserId;
  schema: Schema<UserId>;
  Eq: Eq<UserId>;
}
