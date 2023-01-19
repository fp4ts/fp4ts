// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, newtype, newtypeDerive, TypeOf } from '@fp4ts/core';
import { CodecF, Schema, TypeOf as TypeOfSchema } from '@fp4ts/schema';
import { JsonCodec } from '@fp4ts/schema-json';

export const AnimalSchema = Schema.struct({
  spieces: Schema.string,
  legs: Schema.number,
});

export const AnimalTypeTag = '@fp4ts/http/__tests__/animal';
export type AnimalTypeTag = typeof AnimalTypeTag;

export const Animal =
  newtype<TypeOfSchema<typeof AnimalSchema>>()(AnimalTypeTag);
export type Animal = TypeOf<typeof Animal>;

export const AnimalCodable: JsonCodec<Animal> = newtypeDerive<
  $<CodecF, [string, string]>
>()(Animal, JsonCodec.fromSchema(AnimalSchema));
