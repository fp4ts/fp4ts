// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { newtype, newtypeDerive, TypeOf } from '@fp4ts/core';
import { Schema, TypeOf as TypeOfSchema } from '@fp4ts/schema';
import { Codable, CodableF } from '@fp4ts/http-dsl-server';

export const AnimalSchema = Schema.struct({
  spieces: Schema.string,
  legs: Schema.number,
});

export const AnimalTypeTag = '@fp4ts/http/__tests__/animal';
export type AnimalTypeTag = typeof AnimalTypeTag;

export const Animal =
  newtype<TypeOfSchema<typeof AnimalSchema>>()(AnimalTypeTag);
export type Animal = TypeOf<typeof Animal>;

export const AnimalCodable: Codable<Animal> = newtypeDerive<CodableF>()(
  Animal,
  Codable.json.fromSchema(AnimalSchema),
);
