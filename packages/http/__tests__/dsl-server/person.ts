// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { newtype, TypeOf } from '@fp4ts/core';
import { Schema } from '@fp4ts/schema';
import { JsonCodec } from '@fp4ts/schema-json';

export const PersonTypeTag = '@fp4ts/http/__tests__/person';
export type PersonTypeTag = typeof PersonTypeTag;

export const Person = newtype<{ name: string; age: number }>()(PersonTypeTag);
export type Person = TypeOf<typeof Person>;

export const PersonSchema = Schema.struct({
  name: Schema.string,
  age: Schema.number,
}).imap(Person, Person.unapply);

export const PersonCodable: JsonCodec<Person> =
  JsonCodec.fromSchema(PersonSchema);
