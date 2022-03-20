// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { newtype, TypeOf } from '@fp4ts/core';
import { None, Option, Some } from '@fp4ts/cats';
import { Schema, Schemable } from '@fp4ts/schema';

const _BrandName = newtype<string>()(
  '@fp4ts/shipping-cart/domain/inventory/brand/brand-name',
);

export type BrandName = TypeOf<typeof _BrandName>;

export const BrandName = function (name: string): Option<BrandName> {
  const n = name.trim();
  return n.length > 0 ? Some(_BrandName(name)) : None;
};

BrandName.unsafeFromString = _BrandName;
BrandName.toString = _BrandName.toString;
BrandName.schema = Schema.string.imap(_BrandName, _BrandName.unapply);
BrandName.Eq = BrandName.schema.interpret(Schemable.Eq);
