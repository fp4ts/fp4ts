// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, newtype, TypeOf } from '@fp4ts/core';
import { Schemable } from '@fp4ts/schema';

import { UUID } from '../../../../../common';

const _BrandOwnerId = newtype<UUID>()(
  '@fp4ts/shipping-cart/domain/inventory/brand-owner/brand-owner-id',
);

export type BrandOwnerId = TypeOf<typeof _BrandOwnerId>;

export const BrandOwnerId = function (uuid: UUID): BrandOwnerId {
  return _BrandOwnerId(uuid);
};

BrandOwnerId.unsafeFromString = compose(_BrandOwnerId, UUID.unsafeFromString);
BrandOwnerId.toUUID = _BrandOwnerId.unapply;
BrandOwnerId.toString = compose(UUID.toString, BrandOwnerId.toUUID);
BrandOwnerId.schema = UUID.schema.imap(_BrandOwnerId, _BrandOwnerId.unapply);
BrandOwnerId.Eq = BrandOwnerId.schema.interpret(Schemable.Eq);
