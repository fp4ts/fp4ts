// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, newtype, TypeOf } from '@fp4ts/core';
import { Schemable } from '@fp4ts/schema';

import { UUID } from '../../../../../common';

const _BrandId = newtype<UUID>()(
  '@fp4ts/shipping-cart/domain/inventory/brand/brand-id',
);

export type BrandId = TypeOf<typeof _BrandId>;

export const BrandId = function (uuid: UUID): BrandId {
  return _BrandId(uuid);
};

BrandId.unsafeFromString = compose(_BrandId, UUID.unsafeFromString);
BrandId.toUUID = _BrandId.unapply;
BrandId.toString = compose(UUID.toString, BrandId.toUUID);
BrandId.schema = UUID.schema.imap(_BrandId, _BrandId.unapply);
BrandId.Eq = BrandId.schema.interpret(Schemable.Eq);
BrandId.Ref = _BrandId;
