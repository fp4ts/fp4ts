// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { typeref } from '@fp4ts/core';
import { Schema, TypeOf } from '@fp4ts/schema';
import { JsonCodec } from '@fp4ts/schema-json';

const _CreateBrandDto = Schema.struct({
  name: Schema.string,
});

export type CreateBrandDto = TypeOf<typeof _CreateBrandDto>;
export const CreateBrandDto = function (name: string): CreateBrandDto {
  return { name };
};

CreateBrandDto.schema = _CreateBrandDto;
CreateBrandDto.jsonCodec = JsonCodec.fromSchema(CreateBrandDto.schema);
CreateBrandDto.Ref = typeref<CreateBrandDto>()(
  '@fp4ts/shopping-cart/application/inventory/brand/create-brand-dto',
);
