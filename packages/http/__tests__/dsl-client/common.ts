// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  booleanType,
  newtype,
  numberType,
  pipe,
  stringType,
  TypeOf,
  typeref,
  voidType,
} from '@fp4ts/core';
import { None, Option, Some } from '@fp4ts/cats';
import { IO, IOF } from '@fp4ts/effect-core';
import { Codec, Schema } from '@fp4ts/schema';
import { JsonCodec } from '@fp4ts/schema-json';
import {
  ContentType,
  EntityEncoder,
  HttpApp,
  MediaType,
  ParsingFailure,
  RawHeader,
  Response,
  Status,
} from '@fp4ts/http-core';
import { builtins, toClientIn, ClientM } from '@fp4ts/http-dsl-client';
import {
  BasicAuth,
  Capture,
  CaptureAll,
  DeleteNoContent,
  Get,
  group,
  Header,
  Headers,
  JSON,
  Post,
  QueryParam,
  Raw,
  ReqBody,
  Route,
} from '@fp4ts/http-dsl-shared';
import {
  toHttpAppIO,
  builtins as serverBuiltins,
} from '@fp4ts/http-dsl-server';
import { NodeClient } from '@fp4ts/http-node-client';

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
}).imap(Person.unsafeWrap, Person.unwrap);
export const PersonArraySchema = PersonSchema.array;

export const PersonCodable: JsonCodec<Person> =
  JsonCodec.fromSchema(PersonSchema);
export const PersonArrayCodable: JsonCodec<Person[]> =
  JsonCodec.fromSchema(PersonArraySchema);

export const carol = Person.unsafeWrap({ name: 'Carol', age: 42 });
export const alice = Person.unsafeWrap({ name: 'Alice', age: 18 });

export const stringNumberArrayTupleTag =
  '@fp4ts/http/__tests__/dsl-client/stringNumberArrayTuple';
export const stringNumberArrayTuple = typeref<[string, number[]]>()(
  stringNumberArrayTupleTag,
);
export const stringNumberArrayCodable: Codec<
  string,
  string,
  [string, number[]]
> = JsonCodec.fromSchema(Schema.product(Schema.string, Schema.number.array));

export const multiTupleTupleTag =
  '@fp4ts/http/__tests__/dsl-client/multiTupleTuple';
export const multiTupleTuple =
  typeref<[string, Option<number>, boolean, [string, number[]]]>()(
    multiTupleTupleTag,
  );
export const multiTupleCodable: Codec<
  string,
  string,
  [string, Option<number>, boolean, [string, number[]]]
> = JsonCodec.fromSchema(
  Schema.product(
    Schema.string,
    Schema.number.nullable,
    Schema.boolean,
    Schema.product(Schema.string, Schema.number.array),
  ).imap(
    ([s, n, f, b]) => [s, Option(n), f, b],
    ([s, n, f, b]) => [s, n.getOrElse(() => null), f, b],
  ),
);

const TestHeaders = Headers(
  Header('X-Example-1', numberType),
  Header('X-Example-2', stringType),
);

export const api = group(
  Get(JSON, Person),
  Route('get')[':>'](Get(JSON, Person)),
  Route('deleteEmpty')[':>'](DeleteNoContent),
  Route('capture')[':>'](Capture('name', stringType))[':>'](Get(JSON, Person)),
  Route('captureAll')
    [':>'](CaptureAll('name', stringType))
    [':>'](Get(JSON, PersonArray)),
  Route('body')[':>'](ReqBody(JSON, Person))[':>'](Post(JSON, Person)),
  Route('param')[':>'](QueryParam('name', stringType))[':>'](Get(JSON, Person)),
  // TODO Fragment
  Route('rawSuccess')[':>'](Raw),
  Route('rawSuccessPassHeaders')[':>'](Raw),
  Route('rawFailure')[':>'](Raw),
  Route('multiple')
    [':>'](Capture('first', stringType))
    [':>'](QueryParam('second', numberType))
    [':>'](QueryParam('third', booleanType))
    [':>'](ReqBody(JSON, stringNumberArrayTuple))
    [':>'](Post(JSON, multiTupleTuple)),
  Route('headers')[':>'](Get(JSON, TestHeaders(booleanType))),
);

export const server = toHttpAppIO(api, {
  ...serverBuiltins,
  [JSON.mime]: {
    [PersonTypeTag]: PersonCodable,
    [PersonArrayTypeTag]: PersonArrayCodable,
    [stringNumberArrayTupleTag]: stringNumberArrayCodable,
    [multiTupleTupleTag]: multiTupleCodable,
  },
})(S => [
  S.return(carol),
  S.return(alice),
  S.unit,
  name => S.return(Person.unsafeWrap({ name, age: 0 })),
  names =>
    S.return(
      names.zipWithIndex.map(([name, age]) => Person.unsafeWrap({ name, age }))
        .toArray,
    ),
  S.return,
  name =>
    name.fold(
      () => S.throwError(new ParsingFailure('empty parameter')),
      name =>
        name === 'alice'
          ? S.return(alice)
          : S.throwError(new ParsingFailure(`'${name}' not found`)),
    ),
  HttpApp(_req =>
    IO.pure(
      new Response<IOF>(Status.Ok).withEntity(
        'raw success',
        EntityEncoder.text(),
      ),
    ),
  ),
  HttpApp(req =>
    IO.pure(
      new Response<IOF>(Status.Ok)
        .withEntity('raw success', EntityEncoder.text())
        .putHeaders(req.headers),
    ),
  ),
  HttpApp(_req =>
    IO.pure(
      new Response<IOF>(Status.BadRequest).withEntity(
        'raw failure',
        EntityEncoder.text(),
      ),
    ),
  ),
  a => b => c => d => S.return([a, b, c.getOrElse(() => false), d]),
  pipe(true, S.addHeader('eg2'), S.addHeader(42), S.return),
]);

export const [
  getRoot,
  getGet,
  deleteEmpty,
  getCapture,
  getCaptureAll,
  postBody,
  getParam,
  rawSuccess,
  rawSuccessPassHeaders,
  rawFailure,
  postMultiple,
  getHeaders,
] = toClientIn(ClientM.RunClientIO(NodeClient.makeClient(IO.Async)))(api, {
  ...builtins,
  [JSON.mime]: {
    [PersonTypeTag]: PersonCodable,
    [PersonArrayTypeTag]: PersonArrayCodable,
    [stringNumberArrayTupleTag]: stringNumberArrayCodable,
    [multiTupleTupleTag]: multiTupleCodable,
  },
});

const failApi = group(
  Route('get')[':>'](Raw),
  Route('capture')[':>'](Capture('name', stringType))[':>'](Raw),
  Route('body')[':>'](Raw),
  Route('headers')[':>'](Raw),
);

export const failServer = toHttpAppIO(
  failApi,
  serverBuiltins,
)(S => [
  HttpApp(_req => IO.pure(new Response<IOF>(Status.Ok))),
  _capture =>
    HttpApp(_req =>
      IO.pure(
        new Response<IOF>(Status.Ok).putHeaders(
          new ContentType(MediaType['application/json']),
        ),
      ),
    ),
  HttpApp(_req =>
    IO.pure(
      new Response<IOF>(Status.Ok).putHeaders(
        new RawHeader('Content-Type', 'foooo/bar'),
      ),
    ),
  ),
  HttpApp(_req =>
    IO.pure(
      new Response<IOF>(Status.Ok).putHeaders(
        new ContentType(MediaType['application/json']),
        new RawHeader('X-Example-1', '1'),
        new RawHeader('X-Example-2', 'foo'),
      ),
    ),
  ),
]);

export const basicAuthApi = BasicAuth('foo-realm', voidType)
  [':>']('private')
  [':>']('basic')
  [':>'](Get(JSON, Person));

export const basicAuthServer = toHttpAppIO(basicAuthApi, {
  ...builtins,
  [JSON.mime]: { [PersonTypeTag]: PersonCodable },
  '@fp4ts/dsl-server/basic-auth-validator-tag': {
    'foo-realm': ({ username, password }) =>
      IO.pure(
        username === 'fp4ts' && password === 'server' ? Some(undefined) : None,
      ),
  },
})(S => () => S.return(alice));
