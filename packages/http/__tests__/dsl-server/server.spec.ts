// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import test from 'supertest';
import {
  booleanType,
  id,
  numberType,
  pipe,
  stringType,
  voidType,
} from '@fp4ts/core';
import { IO, IOF } from '@fp4ts/effect-core';
import {
  Accept,
  EntityEncoder,
  HttpApp,
  Method,
  NotFoundFailure,
  Status,
} from '@fp4ts/http-core';
import {
  group,
  JSON,
  PlainText,
  Post,
  Put,
  ReqBody,
  Route,
  Verb,
  VerbNoContent,
  Header,
  Get,
  Headers,
  Raw,
  CaptureAll,
  DeleteNoContent,
  BasicAuth,
} from '@fp4ts/http-dsl-shared';
import { builtins, toHttpAppIO } from '@fp4ts/http-dsl-server';
import { withServerP } from '@fp4ts/http-test-kit-node';
import { Person, PersonCodable, PersonTypeTag } from './person';
import { Monoid, None, Some } from '@fp4ts/cats';
import { Animal, AnimalCodable, AnimalTypeTag } from './animal';

const verbApi = <M extends Method>(method: M, status: Status) =>
  group(
    Verb(method, status)(JSON, Person),
    Route('no-content')[':>'](VerbNoContent(method)),
    Route('header')[':>'](
      Verb(method, status)(
        JSON,
        Headers(Header('H', numberType), Header('F', booleanType))(Person),
      ),
    ),
    Route('accept')[':>'](
      group(
        Verb(method, status)(JSON, Person),
        Verb(method, status)(PlainText, stringType),
      ),
    ),
  );

const alice = Person.unsafeWrap({
  name: 'Alice',
  age: 42,
});
const jerry = Animal.unsafeWrap({ spieces: 'mouse', legs: 4 });
const tweety = Animal.unsafeWrap({ spieces: 'bird', legs: 2 });
const beholder = Animal.unsafeWrap({ spieces: 'beholder', legs: 0 });

describe('verbs', () => {
  const makeServer = <M extends Method>(m: M, status: Status): HttpApp<IOF> =>
    toHttpAppIO(verbApi(m, status), {
      ...builtins,
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

  function runTests(server: HttpApp<IOF>, method: Method, status: Status) {
    const m = method.methodName.toLowerCase() as StringMethod;

    if (method !== Method.HEAD) {
      it.M('should return a person', () =>
        withServerP(server)(server =>
          test(server)
            [m]('/')
            .accept('application/json')
            .then(response => {
              expect(response.statusCode).toBe(status.code);
              expect(response.body).toEqual({ name: 'Alice', age: 42 });
            }),
        ),
      );
    }

    it.M('should return no content', () =>
      withServerP(server)(server =>
        test(server)
          [m]('/no-content')
          .then(response => {
            expect(response.statusCode).toBe(204);
            expect(response.text === '' || response.text === undefined).toBe(
              true,
            );
            expect(response.body).toEqual({});
          }),
      ),
    );

    if (method === Method.HEAD) {
      it.M('should return no body on HEAD', () =>
        withServerP(server)(server =>
          test(server)
            [m]('/')
            .accept('application/json')
            .then(response => {
              expect(response.statusCode).toBe(status.code);
              expect(response.body).toEqual({});
            }),
        ),
      );
    }

    it('should return Method Not Allowed', async () =>
      withServerP(server)(server =>
        test(server)
          [wrongMethod(m)]('/')
          .then(response => {
            expect(response.statusCode).toBe(405);
          }),
      ));

    it.M('should return headers', () =>
      withServerP(server)(server =>
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
      ),
    );

    it.M(`should handle trailing '/' gracefully`, () =>
      withServerP(server)(server =>
        test(server)
          [m]('/no-content/')
          .then(response => {
            expect(response.statusCode).toBe(204);
          }),
      ),
    );

    if (method !== Method.HEAD) {
      it.M('should route based on accept header to text', () =>
        withServerP(server)(server =>
          test(server)
            [m]('/accept')
            .accept('text/plain')
            .then(response => {
              expect(response.statusCode).toBe(status.code);
              expect(response.text).toBe('A');
            }),
        ),
      );
    }

    it.M('should route based on accept header to json', () =>
      withServerP(server)(server =>
        test(server)
          [m]('/accept')
          .accept('application/json')
          .then(response => {
            expect(response.statusCode).toBe(status.code);
            expect(response.headers['content-type']).toBe('application/json');
          }),
      ),
    );

    it.M('should return 406 when Accept header not supported', () =>
      withServerP(server)(server =>
        test(server)
          [m]('/accept')
          .accept('image/jpeg')
          .then(response => expect(response.statusCode).toBe(406)),
      ),
    );
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
    builtins,
  )(S => [
    ah =>
      S.return(
        ah.fold(
          () => 'no header',
          ah => `${ah.values.toArray}`,
        ),
      ),
    hv => S.return(hv.get),
  ]);

  it.M('should capture Accept header', () =>
    withServerP(server)(server =>
      test(server)
        .get('/accept')
        .accept('text/plain')
        .then(response => {
          expect(response.statusCode).toBe(200);
          expect(response.text).toBe('text/plain;q=1.000');
        }),
    ),
  );

  it.M('should handle case when the header is not provided', () =>
    withServerP(server)(server =>
      test(server)
        .get('/accept')
        .then(response => {
          expect(response.statusCode).toBe(200);
          expect(response.text).toBe('no header');
        }),
    ),
  );

  it.M('should capture custom raw header', () =>
    withServerP(server)(server =>
      test(server)
        .get('/custom')
        .set('X-Custom-Header', '42')
        .then(response => {
          expect(response.statusCode).toBe(200);
          expect(response.text).toBe('42');
        }),
    ),
  );

  it.M('should return 400 Bad Request when header value is string', () =>
    withServerP(server)(server =>
      test(server)
        .get('/custom')
        .set('X-Custom-Header', 'my string')
        .then(response => {
          expect(response.statusCode).toBe(400);
        }),
    ),
  );
});

const reqBodyApi = group(
  ReqBody(JSON, Person)[':>'](Post(JSON, Person)),
  Route('foo')[':>'](ReqBody(JSON, Person))[':>'](Put(JSON, numberType)),
);

describe('ReqBody', () => {
  const server = toHttpAppIO(reqBodyApi, {
    [JSON.mime]: { [PersonTypeTag]: PersonCodable },
  })(S => [S.return, p => S.return(Person.unwrap(p).age)]);

  it.M('should pass argument to the method handler', () =>
    withServerP(server)(server =>
      test(server)
        .post('/')
        .type('application/json')
        .send(alice)
        .then(response => {
          expect(response.statusCode).toBe(200);
          expect(response.body).toEqual(alice);
        }),
    ),
  );

  it.M('should reject invalid content type with status code 415', () =>
    withServerP(server)(server =>
      test(server)
        .put('/foo')
        .type('text/plain')
        .send('some text')
        .then(response => {
          expect(response.statusCode).toBe(415);
        }),
    ),
  );
});

const captureAllApi = CaptureAll('legs', numberType)[':>'](Get(JSON, Animal));

describe('Capture All', () => {
  const server = toHttpAppIO(captureAllApi, {
    ...builtins,
    [JSON.mime]: { [AnimalTypeTag]: AnimalCodable },
  })(S => xs => {
    switch (xs.sum()) {
      case 4:
        return S.return(jerry);
      case 2:
        return S.return(tweety);
      case 0:
        return S.return(beholder);
      default:
        return S.throwError(new NotFoundFailure());
    }
  });

  it.M('should capture a single path component', () =>
    withServerP(server)(server =>
      test(server)
        .get('/2')
        .then(response => expect(response.body).toEqual(tweety)),
    ),
  );

  it.M('should capture two path components', () =>
    withServerP(server)(server =>
      test(server)
        .get('/2/2')
        .then(response => expect(response.body).toEqual(jerry)),
    ),
  );

  it.M('should many path components', () =>
    withServerP(server)(server =>
      test(server)
        .get('/1/1/0/1/0/1/')
        .then(response => expect(response.body).toEqual(jerry)),
    ),
  );

  it.M('should capture no elements from the path', () =>
    withServerP(server)(server =>
      test(server)
        .get('/')
        .then(response => expect(response.body).toEqual(beholder)),
    ),
  );

  it.M('should respond with 400 Bad Request when parsing fails', () =>
    withServerP(server)(server =>
      test(server)
        .get('/not-a-number')
        .then(response => expect(response.statusCode).toBe(400)),
    ),
  );

  it.M(
    'should respond with 400 Bad Request when parsing fails for any of the elements',
    () =>
      withServerP(server)(server =>
        test(server)
          .get('/1/2/3/not-a-number')
          .then(response => expect(response.statusCode).toBe(400)),
      ),
  );

  it.M(
    'should respond with 400 Bad Request when parsing fails for any of the elements more than once',
    () =>
      withServerP(server)(server =>
        test(server)
          .get('/1/2/3/not-a-number/4/5/another-string')
          .then(response => expect(response.statusCode).toBe(400)),
      ),
  );
});

const rawApi = group(Route('foo')[':>'](Raw), Route('bar')[':>'](Raw));

describe('Raw', () => {
  const server = toHttpAppIO(
    rawApi,
    {},
  )(() => [
    req => IO.pure(Status.Ok(req.method.methodName)(EntityEncoder.text())),
    req =>
      IO.pure(
        Status.Ok(req.uri.path.components.join('/'))(EntityEncoder.text()),
      ),
  ]);

  it.M('should pass request with any method to the router', () =>
    withServerP(server)(server =>
      test(server)
        .get('/foo')
        .then(response => {
          expect(response.statusCode).toBe(200);
          expect(response.text).toBe('GET');
        })
        .then(() =>
          test(server)
            .post('/foo')
            .then(response => {
              expect(response.statusCode).toBe(200);
              expect(response.text).toBe('POST');
            }),
        ),
    ),
  );

  it.M('should capture the reminder of the route', () =>
    withServerP(server)(server =>
      test(server)
        .get('/bar/baz/foo')
        .then(response => {
          expect(response.statusCode).toBe(200);
          expect(response.text).toBe('/baz/foo');
        }),
    ),
  );
});

const alternativeApi = group(
  Route('foo')[':>'](Get(JSON, Person)),
  Route('bar')[':>'](Get(JSON, Animal)),
  Route('foo')[':>'](Get(PlainText, stringType)),
  Route('bar')[':>'](Post(JSON, Animal)),
  Route('bar')[':>'](Put(JSON, Animal)),
  Route('bar')[':>'](DeleteNoContent),
);

describe('Alternative', () => {
  const server = toHttpAppIO(alternativeApi, {
    ...builtins,
    [JSON.mime]: {
      [PersonTypeTag]: PersonCodable,
      [AnimalTypeTag]: AnimalCodable,
    },
  })(S => [
    S.return(alice),
    S.return(jerry),
    S.return('a string'),
    S.return(jerry),
    S.return(tweety),
    S.NoContent,
  ]);

  it.M('should union the endpoints', () =>
    withServerP(server)(server =>
      test(server)
        .get('/foo')
        .then(response => {
          expect(response.statusCode).toBe(200);
          expect(response.body).toEqual(alice);
        })
        .then(() =>
          test(server)
            .get('/bar')
            .then(response => {
              expect(response.statusCode).toBe(200);
              expect(response.body).toEqual(jerry);
            }),
        ),
    ),
  );

  it.M('should route based on the accept header', () =>
    withServerP(server)(server =>
      test(server)
        .get('/foo')
        .accept('text/plain')
        .then(response => {
          expect(response.statusCode).toBe(200);
          expect(response.text).toBe('a string');
        }),
    ),
  );

  it.M('should return 404 when the path does not exist', () =>
    withServerP(server)(server =>
      test(server)
        .get('/non-existent-path')
        .then(response => expect(response.statusCode).toBe(404)),
    ),
  );
});

const basicAuthApi = group(
  BasicAuth('foo', voidType)[':>']('basic')[':>'](Get(JSON, Animal)),
  Raw,
);

describe('Basic Auth', () => {
  const server = toHttpAppIO(basicAuthApi, {
    ...builtins,
    'application/json': { '@fp4ts/http/__tests__/animal': AnimalCodable },
    '@fp4ts/dsl-server/basic-auth-validator-tag': {
      foo: ({ username, password }) =>
        IO.pure(
          username === 'fp4ts' && password === 'server'
            ? Some(undefined)
            : None,
        ),
    },
  })(S => [
    () => S.return(jerry),
    HttpApp(_req => IO.pure(Status.ImATeapot<IOF>())),
  ]);

  it.M(
    'should respond with 401 Unauthorized without Authorization header',
    () =>
      withServerP(server)(server =>
        test(server)
          .get('/basic')
          .then(response => {
            expect(response.statusCode).toBe(401);
            expect(response.text).toBe('Unauthorized');
          }),
      ),
  );

  it.M('should respond with 401 Unauthorized when password mismatch', () =>
    withServerP(server)(server =>
      test(server)
        .get('/basic')
        .auth('fp4ts', 'wrong')
        .then(response => {
          expect(response.statusCode).toBe(401);
          expect(response.text).toBe('Unauthorized');
        }),
    ),
  );

  it.M('should respond with 200 when the auth succeeds', () =>
    withServerP(server)(server =>
      test(server)
        .get('/basic')
        .auth('fp4ts', 'server')
        .then(response => {
          expect(response.statusCode).toBe(200);
          expect(response.body).toEqual(jerry);
        }),
    ),
  );

  it.M('should work with alternate routes', () =>
    withServerP(server)(server =>
      test(server)
        .get('/foo')
        .then(response => {
          expect(response.statusCode).toBe(418);
        }),
    ),
  );
});
