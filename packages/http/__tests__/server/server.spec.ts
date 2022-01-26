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

  const wrongMethod = (m: StringMethod): StringMethod =>
    m === 'patch' ? 'post' : 'patch';
  type StringMethod = 'get' | 'put' | 'post' | 'patch' | 'delete' | 'head';

  function runTests(server: HttpApp<IoK>, method: Method, status: Status) {
    const m = method.methodName.toLowerCase() as StringMethod;

    if (method !== Method.HEAD) {
      it('should return a person', async () => {
        await withServerP(server)(server =>
          test(server)
            [m]('/')
            .accept('application/json')
            .then(response => {
              expect(response.statusCode).toBe(status.code);
              expect(response.body).toEqual({ name: 'Alice', age: 42 });
            }),
        ).unsafeRunToPromise();
      });
    }

    it('should return no content', async () => {
      await withServerP(server)(server =>
        test(server)
          [m]('/no-content')
          .then(response => {
            expect(response.statusCode).toBe(204);
            expect(response.text === '' || response.text === undefined).toBe(
              true,
            );
            expect(response.body).toEqual({});
          }),
      ).unsafeRunToPromise();
    });

    if (method === Method.HEAD) {
      it('should return no body on HEAD', async () => {
        await withServerP(server)(server =>
          test(server)
            [m]('/')
            .accept('application/json')
            .then(response => {
              expect(response.statusCode).toBe(status.code);
              expect(response.body).toEqual({});
            }),
        ).unsafeRunToPromise();
      });
    }

    it('should return Method Not Allowed', async () => {
      await withServerP(server)(server =>
        test(server)
          [wrongMethod(m)]('/')
          .then(response => {
            expect(response.statusCode).toBe(405);
          }),
      ).unsafeRunToPromise();
    });

    it('should return headers', async () => {
      await withServerP(server)(server =>
        test(server)
          [m]('/header')
          .then(response => {
            expect(response.statusCode).toBe(status.code);
            expect(response.headers.h).toBe('42');
            expect(response.headers.f).toBe('false');
          })
          .then(() =>
            test(server)
              [m]('/header')
              .then(response => {
                expect(response.statusCode).toBe(status.code);
                expect(response.headers.h).toBe('42');
                expect(response.headers.f).toBe('false');
              }),
          ),
      ).unsafeRunToPromise();
    });

    it(`should handle trailing '/' gracefully`, async () => {
      await withServerP(server)(server =>
        test(server)
          [m]('/no-content/')
          .then(response => {
            expect(response.statusCode).toBe(204);
          }),
      ).unsafeRunToPromise();
    });

    if (method !== Method.HEAD) {
      it('should route based on accept header to text', async () => {
        await withServerP(server)(server =>
          test(server)
            [m]('/accept')
            .accept('text/plain')
            .then(response => {
              expect(response.statusCode).toBe(status.code);
              expect(response.text).toBe('A');
            }),
        ).unsafeRunToPromise();
      });
    }

    it('should route based on accept header to json', async () => {
      await withServerP(server)(server =>
        test(server)
          [m]('/accept')
          .accept('application/json')
          .then(response => {
            expect(response.statusCode).toBe(status.code);
            expect(response.headers['content-type']).toBe('application/json');
          }),
      ).unsafeRunToPromise();
    });

    it('should return 406 when Accept header not supported', async () => {
      await withServerP(server)(server =>
        test(server)
          [m]('/accept')
          .accept('image/jpeg')
          .then(response => expect(response.statusCode).toBe(406)),
      ).unsafeRunToPromise();
    });
  }

  const getOk = makeServer(Method.GET, Status.Ok);
  const postCreated = makeServer(Method.POST, Status.Created);
  const putAccepted = makeServer(Method.PUT, Status.Accepted);
  const deleteOk = makeServer(Method.DELETE, Status.Ok);
  const patchAccepted = makeServer(Method.PATCH, Status.Accepted);
  describe('GET 200', () => runTests(getOk, Method.GET, Status.Ok));
  describe('POST 201', () =>
    runTests(postCreated, Method.POST, Status.Created));
  describe('PUT 202', () => runTests(putAccepted, Method.PUT, Status.Accepted));
  describe('DELETE 200', () => runTests(deleteOk, Method.DELETE, Status.Ok));
  describe('PATCH 202', () =>
    runTests(patchAccepted, Method.PATCH, Status.Accepted));
  describe('GET 200 with HEAD', () => runTests(getOk, Method.HEAD, Status.Ok));
});

const headerApi = group(
  Route('accept')
    [':>'](Header(Accept.Select))
    [':>'](Get(PlainText, stringType)),
  Route('custom')
    [':>'](Header('X-Custom-Header', numberType))
    [':>'](Get(PlainText, numberType)),
);

describe('Header', () => {
  const server = toHttpAppIO(
    headerApi,
    {},
  )(S => [
    ah =>
      S.return(
        ah.fold(
          () => 'no header',
          ah => `${ah.mediaRanges.toArray}`,
        ),
      ),
    hv => S.return(hv.get),
  ]);

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

  it('should handle case when the header is not provided', async () => {
    await withServerP(server)(server =>
      test(server)
        .get('/accept')
        .then(response => {
          expect(response.statusCode).toBe(200);
          expect(response.text).toBe('no header');
        }),
    ).unsafeRunToPromise();
  });

  it('should capture custom raw header', async () => {
    await withServerP(server)(server =>
      test(server)
        .get('/custom')
        .set('X-Custom-Header', '42')
        .then(response => {
          expect(response.statusCode).toBe(200);
          expect(response.text).toBe('42');
        }),
    ).unsafeRunToPromise();
  });

  it('should return 400 Bad Request when header value is string', async () => {
    await withServerP(server)(server =>
      test(server)
        .get('/custom')
        .set('X-Custom-Header', 'my string')
        .then(response => {
          expect(response.statusCode).toBe(400);
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
