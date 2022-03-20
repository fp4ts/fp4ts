// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { typeref } from '@fp4ts/core';
import { Schema, Schemable, TypeOf } from '@fp4ts/schema';

import { BrandOwnerId } from './values';

const _BrandOwner = Schema.struct({
  id: BrandOwnerId.schema,
});

export type BrandOwner = TypeOf<typeof _BrandOwner>;

export const BrandOwner = function (id: BrandOwnerId): BrandOwner {
  return { id };
};

BrandOwner.schema = _BrandOwner;
BrandOwner.Eq = _BrandOwner.interpret(Schemable.Eq);
BrandOwner.Ref = typeref<BrandOwner>()(
  '@fp4ts/shopping-cart/domain/inventory/brand-owner/brand-owner',
);
