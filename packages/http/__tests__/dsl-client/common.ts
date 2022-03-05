// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  booleanType,
  newtype,
  numberType,
  stringType,
  TypeOf,
  typeref,
} from '@fp4ts/core';
import { Schema } from '@fp4ts/schema';
import { Codable } from '@fp4ts/http-dsl-client';
import {
  Capture,
  CaptureAll,
  DeleteNoContent,
  Get,
  group,
  Header,
  Headers,
  JSON,
  Post,
  Query,
  Raw,
  ReqBody,
  Route,
} from '@fp4ts/http-dsl-shared';
import { toHttpAppIO } from '@fp4ts/http-dsl-server';
import { Server } from '@fp4ts/http-dsl-server/src/type-level';
import { IOF } from '@fp4ts/effect-core';
import { DeriveCoding } from '@fp4ts/http-dsl-server/src/type-level';
import { OmitBuiltins } from '@fp4ts/http-dsl-server/lib/type-level';
import { builtins } from '@fp4ts/http-dsl-server/lib/builtin-codables';

export const PersonTypeTag = '@fp4ts/http/__tests__/dsl-client/person';
export type PersonTypeTag = typeof PersonTypeTag;
export const PersonArrayTypeTag =
  '@fp4ts/http/__tests__/dsl-client/person-array';
export type PersonArrayTypeTag = typeof PersonArrayTypeTag;

export const Person = newtype<{ name: string; age: number }>()(PersonTypeTag);
export type Person = TypeOf<typeof Person>;
export const PersonArray = typeref<Person[]>()(PersonArrayTypeTag);
export type PersonArray = typeof PersonArray;

export const PersonSchema = Schema.struct({
  name: Schema.string,
  age: Schema.number,
}).imap(Person, Person.unapply);
export const PersonArraySchema = PersonSchema.array;

export const PersonCodable: Codable<Person> =
  Codable.json.fromSchema(PersonSchema);
export const PersonArrayCodable: Codable<Person[]> =
  Codable.json.fromSchema(PersonArraySchema);

export const carol = Person({ name: 'Carol', age: 42 });
export const alice = Person({ name: 'Alice', age: 18 });

const stringNumberArrayTupleTag =
  '@fp4ts/http/__tests__/dsl-client/stringNumberArrayTuple';
export const stringNumberArrayTuple = typeref<[string, number[]]>()(
  stringNumberArrayTupleTag,
);
export const stringNumberArrayCodable: Codable<[string, number[]]> =
  Codable.json.fromSchema(Schema.product(Schema.string, Schema.number.array));

const TestHeaders = Headers(
  Header('X-Example-1', numberType),
  Header('X-Example-2', stringType),
);

const api = group(
  Get(JSON, Person),
  Route('get')[':>'](Get(JSON, Person)),
  Route('deleteEmpty')[':>'](DeleteNoContent),
  Route('capture')[':>'](Capture.string('name'))[':>'](Get(JSON, Person)),
  Route('captureAll')
    [':>'](CaptureAll('name', stringType))
    [':>'](Get(JSON, PersonArray)),
  Route('body')[':>'](ReqBody(JSON, Person))[':>'](Post(JSON, Person)),
  Route('param')[':>'](Query.string('name'))[':>'](Get(JSON, Person)),
  // TODO Fragment
  Route('rawSuccess')[':>'](Raw),
  Route('rawSuccessPassHeaders')[':>'](Raw),
  Route('rawFailure')[':>'](Raw),
  Route('multiple')
    [':>'](Capture.string('first'))
    [':>'](Query.string('second'))
    [':>'](Query.boolean('third'))
    [':>'](ReqBody(JSON, stringNumberArrayTuple))
    [':>'](Get(JSON, stringNumberArrayTuple)),
  Route('headers')[':>'](Get(JSON, TestHeaders(booleanType))),
);

type server = Server<IOF, typeof api>;
type D = DeriveCoding<IOF, typeof api>;
type codables = OmitBuiltins<D>;

export const server = toHttpAppIO(api, {
  ...builtins,
  [JSON.mime]: {
    [PersonTypeTag]: PersonCodable,
    [PersonArrayTypeTag]: PersonArrayCodable,
    [stringNumberArrayTupleTag]: stringNumberArrayCodable,
  },
});
