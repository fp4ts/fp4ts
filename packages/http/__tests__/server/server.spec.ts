// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import test from 'supertest';
import { EitherT } from '@fp4ts/cats';
import { IO, IoK } from '@fp4ts/effect-core';
import { HttpApp, Method, Status } from '@fp4ts/http-core';
import {
  group,
  JSON,
  numberType,
  PlainText,
  Post,
  Put,
  ReqBody,
  Route,
  stringType,
  Verb,
  VerbNoContent,
} from '@fp4ts/http-dsl-shared';
import { toHttpAppIO } from '@fp4ts/http-dsl-server';
import { withServerP } from '@fp4ts/http-test-kit-node';
import { Person, PersonCodable, PersonType, PersonTypeTag } from './person';

const verbApi = <M extends Method>(method: M, status: Status) =>
  group(
    Verb(method, status)(JSON, PersonType),
    Route('no-content')[':>'](VerbNoContent(method)),
    Route('accept')[':>'](
      group(
        Route('json')[':>'](Verb(method, status)(JSON, PersonType)),
        Route('text')[':>'](Verb(method, status)(PlainText, stringType)),
      ),
    ),
  );

const alice: Person = {
  name: 'Alice',
  age: 42,
};

describe('verbs', () => {
  const makeServer = <M extends Method>(m: M, status: Status): HttpApp<IoK> =>
    toHttpAppIO(
      verbApi(m, status),
      [
        EitherT.right(IO.Monad)(alice),
        EitherT.rightUnit(IO.Monad),
        [EitherT.right(IO.Monad)(alice), EitherT.right(IO.Monad)('A')],
      ],
      { [JSON.mime]: { [PersonTypeTag]: PersonCodable } },
    );

  describe('GET 200', () => {
    const server = makeServer(Method.GET, Status.Ok);
    it('should return a person', async () => {
      await withServerP(server)(server =>
        test(server)
          .get('/')
          .accept('application/json')
          .then(response => {
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ name: 'Alice', age: 42 });
          }),
      ).unsafeRunToPromise();
    });

    it('should return no content', async () => {
      await withServerP(server)(server =>
        test(server)
          .get('/no-content')
          .then(response => {
            expect(response.statusCode).toBe(204);
            expect(response.text).toEqual('');
            expect(response.body).toEqual({});
          }),
      ).unsafeRunToPromise();
    });

    it('should return no body on HEAD', async () => {
      await withServerP(server)(server =>
        test(server)
          .head('/')
          .accept('application/json')
          .then(response => {
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({});
          }),
      ).unsafeRunToPromise();
    });

    it('should return Method Not Allowed', async () => {
      await withServerP(server)(server =>
        test(server)
          .post('/')
          .then(response => {
            expect(response.statusCode).toBe(405);
          }),
      ).unsafeRunToPromise();
    });

    it(`should handle trailing '/' gracefully`, async () => {
      await withServerP(server)(server =>
        test(server)
          .get('/no-content/')
          .then(response => {
            expect(response.statusCode).toBe(204);
          }),
      ).unsafeRunToPromise();
    });

    it('should return 406 when Accept header not supported', async () => {
      await withServerP(server)(server =>
        test(server)
          .get('/accept/json')
          .accept('text/plain')
          .then(response => expect(response.statusCode).toBe(406)),
      ).unsafeRunToPromise();
    });

    it('should return 406 when Accept header not supported', async () => {
      await withServerP(server)(server =>
        test(server)
          .get('/accept/text')
          .accept('application/json')
          .then(response => expect(response.statusCode).toBe(406)),
      ).unsafeRunToPromise();
    });
  });
});

const reqBodyApi = group(
  ReqBody(JSON, PersonType)[':>'](Post(JSON, PersonType)),
  Route('foo')[':>'](ReqBody(JSON, PersonType))[':>'](Put(JSON, numberType)),
);

describe('ReqBody', () => {
  const server = toHttpAppIO(
    reqBodyApi,
    [EitherT.right(IO.Monad), ({ age }) => EitherT.right(IO.Monad)(age)],
    { [JSON.mime]: { [PersonTypeTag]: PersonCodable } },
  );

  it('should pass argument to the method handler', async () => {
    await withServerP(server)(server =>
      test(server)
        .post('/')
        .type('application/json')
        .send(alice)
        .then(response => {
          expect(response.statusCode).toBe(200);
          expect(response.body).toEqual(alice);
        }),
    ).unsafeRunToPromise();
  });

  it('should reject invalid content type with status code 400', async () => {
    await withServerP(server)(server =>
      test(server)
        .put('/foo')
        .type('text/plain')
        .send('some text')
        .then(response => {
          expect(response.statusCode).toBe(400);
        }),
    ).unsafeRunToPromise();
  });
});
