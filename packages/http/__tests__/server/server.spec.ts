// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import test from 'supertest';
import { pipe } from '@fp4ts/core';
import { IoK } from '@fp4ts/effect-core';
import { Accept, HttpApp, Method, Status } from '@fp4ts/http-core';
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
  Header,
  Get,
  Headers,
  booleanType,
} from '@fp4ts/http-dsl-shared';
import { toHttpAppIO } from '@fp4ts/http-dsl-server';
import { withServerP } from '@fp4ts/http-test-kit-node';
import { Person, PersonCodable, PersonType, PersonTypeTag } from './person';

const verbApi = <M extends Method>(method: M, status: Status) =>
  group(
    Verb(method, status)(JSON, PersonType),
    Route('no-content')[':>'](VerbNoContent(method)),
    Route('header')[':>'](
      Verb(method, status)(
        JSON,
        Headers(Header('H', numberType), Header('F', booleanType))(PersonType),
      ),
    ),
    Route('accept')[':>'](
      group(
        Verb(method, status)(JSON, PersonType),
        Verb(method, status)(PlainText, stringType),
      ),
    ),
  );

const alice: Person = {
  name: 'Alice',
  age: 42,
};

describe('verbs', () => {
  const makeServer = <M extends Method>(m: M, status: Status): HttpApp<IoK> =>
    toHttpAppIO(verbApi(m, status), {
      [JSON.mime]: { [PersonTypeTag]: PersonCodable },
    })(S => [
      S.return(alice),
      S.unit,
      pipe(alice, S.addHeader(false), S.addHeader(42), S.return),
      [S.return(alice), S.return('A')],
    ]);

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

    it('should return headers', async () => {
      await withServerP(server)(server =>
        test(server)
          .get('/header')
          .then(response => {
            expect(response.statusCode).toBe(200);
            expect(response.headers.h).toBe('42');
            expect(response.headers.f).toBe('false');
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

    it('should route based on accept header to text', async () => {
      await withServerP(server)(server =>
        test(server)
          .get('/accept')
          .accept('text/plain')
          .then(response => {
            expect(response.statusCode).toBe(200);
            expect(response.text).toBe('A');
          }),
      ).unsafeRunToPromise();
    });

    it('should route based on accept header to json', async () => {
      await withServerP(server)(server =>
        test(server)
          .get('/accept')
          .accept('application/json')
          .then(response => {
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ name: 'Alice', age: 42 });
          }),
      ).unsafeRunToPromise();
    });

    it('should return 406 when Accept header not supported', async () => {
      await withServerP(server)(server =>
        test(server)
          .get('/accept')
          .accept('image/jpeg')
          .then(response => expect(response.statusCode).toBe(406)),
      ).unsafeRunToPromise();
    });
  });
});

const headerApi = group(
  Route('accept')
    [':>'](Header(Accept.Select))
    [':>'](Get(PlainText, stringType)),
  Route('custom')
    [':>'](Header('X-Custom-Header', stringType))
    [':>'](Get(PlainText, stringType)),
);

describe('Header', () => {
  const server = toHttpAppIO(
    headerApi,
    {},
  )(S => [ah => S.return(`${ah.mediaRanges.toArray}`), hv => S.return(hv)]);

  it('should capture Accept header', async () => {
    await withServerP(server)(server =>
      test(server)
        .get('/accept')
        .accept('text/plain')
        .then(response => {
          expect(response.statusCode).toBe(200);
          expect(response.text).toBe('text/plain');
        }),
    ).unsafeRunToPromise();
  });

  it('should capture custom raw header', async () => {
    await withServerP(server)(server =>
      test(server)
        .get('/custom')
        .set('X-Custom-Header', 'my-test')
        .then(response => {
          expect(response.statusCode).toBe(200);
          expect(response.text).toBe('my-test');
        }),
    ).unsafeRunToPromise();
  });
});

const reqBodyApi = group(
  ReqBody(JSON, PersonType)[':>'](Post(JSON, PersonType)),
  Route('foo')[':>'](ReqBody(JSON, PersonType))[':>'](Put(JSON, numberType)),
);

describe('ReqBody', () => {
  const server = toHttpAppIO(reqBodyApi, {
    [JSON.mime]: { [PersonTypeTag]: PersonCodable },
  })(S => [S.return, ({ age }) => S.return(age)]);

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

  it('should reject invalid content type with status code 415', async () => {
    await withServerP(server)(server =>
      test(server)
        .put('/foo')
        .type('text/plain')
        .send('some text')
        .then(response => {
          expect(response.statusCode).toBe(415);
        }),
    ).unsafeRunToPromise();
  });
});
