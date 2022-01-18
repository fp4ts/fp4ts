// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EitherT, Identity, IdentityK, Try } from '@fp4ts/cats';
import {
  Schema,
  TypeOf,
  DecoderT,
  Encoder,
  DecodeFailure,
} from '@fp4ts/schema';
import { typeDef } from '@fp4ts/http-dsl-shared';
import { Codable } from '@fp4ts/http-dsl-server';
import { ParsingFailure } from '@fp4ts/http-core';

export const Person = Schema.struct({
  name: Schema.string,
  age: Schema.number,
});

export type Person = TypeOf<typeof Person>;

export const PersonTypeTag = '@fp4ts/http/__tests__/person';
export type PersonTypeTag = typeof PersonTypeTag;
export const PersonType = typeDef(PersonTypeTag, Person);

export const PersonCodable: Codable<Person> = Codable.json.fromSchema(Person);