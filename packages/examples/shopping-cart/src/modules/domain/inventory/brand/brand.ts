// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { typeref } from '@fp4ts/core';
import { Schema, Schemable, TypeOf } from '@fp4ts/schema';

import { BrandOwner, BrandOwnerId } from '../brand-owner';
import { BrandId, BrandName } from './values';

const _Brand = Schema.struct({
  id: BrandId.schema,
  name: BrandName.schema,
  active: Schema.boolean,
  owner: BrandOwnerId.schema,
});

export type Brand = TypeOf<typeof _Brand>;

export const Brand = function (
  id: BrandId,
  name: BrandName,
  owner: BrandOwner,
  active: boolean = true,
): Brand {
  return { id, name, owner: owner.id, active };
};

Brand.schema = _Brand;
Brand.Eq = _Brand.interpret(Schemable.Eq);
Brand.Ref = typeref<Brand>()(
  '@fp4ts/shopping-cart/domain/inventory/brand/brand',
);
