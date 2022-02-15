// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import test from 'supertest';
import { id, pipe } from '@fp4ts/core';
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
  Raw,
  CaptureAll,
  DeleteNoContent,
} from '@fp4ts/http-dsl-shared';
import { toHttpAppIO } from '@fp4ts/http-dsl-server';
import { withServerP } from '@fp4ts/http-test-kit-node';
import { Person, PersonCodable, PersonType, PersonTypeTag } from './person';
import { Kleisli, Monoid } from '@fp4ts/cats';
import { Animal, AnimalCodable, AnimalType, AnimalTypeTag } from './animal';

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
const jerry: Animal = { spieces: 'mouse', legs: 4 };
const tweety: Animal = { spieces: 'bird', legs: 2 };
const beholder: Animal = { spieces: 'beholder', legs: 0 };

describe('verbs', () => {
  const makeServer = <M extends Method>(m: M, status: Status): HttpApp<IOF> =>
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

  function runTests(server: HttpApp<IOF>, method: Method, status: Status) {
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

const captureAllApi = CaptureAll('legs', numberType)[':>'](
  Get(JSON, AnimalType),
);

describe('Capture All', () => {
  const server = toHttpAppIO(captureAllApi, {
    [JSON.mime]: { [AnimalTypeTag]: AnimalCodable },
  })(S => xs => {
    switch (xs.foldMap(Monoid.addition)(id)) {
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

  it('should capture a single path component', async () => {
    await withServerP(server)(server =>
      test(server)
        .get('/2')
        .then(response => expect(response.body).toEqual(tweety)),
    ).unsafeRunToPromise();
  });

  it('should capture two path components', async () => {
    await withServerP(server)(server =>
      test(server)
        .get('/2/2')
        .then(response => expect(response.body).toEqual(jerry)),
    ).unsafeRunToPromise();
  });

  it('should many path components', async () => {
    await withServerP(server)(server =>
      test(server)
        .get('/1/1/0/1/0/1/')
        .then(response => expect(response.body).toEqual(jerry)),
    ).unsafeRunToPromise();
  });

  it('should capture no elements from the path', async () => {
    await withServerP(server)(server =>
      test(server)
        .get('/')
        .then(response => expect(response.body).toEqual(beholder)),
    ).unsafeRunToPromise();
  });

  it('should respond with 400 Bad Request when parsing fails', async () => {
    await withServerP(server)(server =>
      test(server)
        .get('/not-a-number')
        .then(response => expect(response.statusCode).toBe(400)),
    ).unsafeRunToPromise();
  });

  it('should respond with 400 Bad Request when parsing fails for any of the elements', async () => {
    await withServerP(server)(server =>
      test(server)
        .get('/1/2/3/not-a-number')
        .then(response => expect(response.statusCode).toBe(400)),
    ).unsafeRunToPromise();
  });

  it('should respond with 400 Bad Request when parsing fails for any of the elements more than once', async () => {
    await withServerP(server)(server =>
      test(server)
        .get('/1/2/3/not-a-number/4/5/another-string')
        .then(response => expect(response.statusCode).toBe(400)),
    ).unsafeRunToPromise();
  });
});

const rawApi = group(Route('foo')[':>'](Raw), Route('bar')[':>'](Raw));

describe('Raw', () => {
  const server = toHttpAppIO(
    rawApi,
    {},
  )(() => [
    Kleisli(req =>
      IO.pure(Status.Ok(req.method.methodName)(EntityEncoder.text())),
    ),
    Kleisli(req =>
      IO.pure(
        Status.Ok(req.uri.path.components.join('/'))(EntityEncoder.text()),
      ),
    ),
  ]);

  it('should pass request with any method to the router', async () => {
    await withServerP(server)(server =>
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
    ).unsafeRunToPromise();
  });

  it('should capture the entire reminder of the route', async () => {
    await withServerP(server)(server =>
      test(server)
        .get('/bar/baz/foo')
        .then(response => {
          expect(response.statusCode).toBe(200);
          expect(response.text).toBe('/bar/baz/foo');
        }),
    ).unsafeRunToPromise();
  });
});

const alternativeApi = group(
  Route('foo')[':>'](Get(JSON, PersonType)),
  Route('bar')[':>'](Get(JSON, AnimalType)),
  Route('foo')[':>'](Get(PlainText, stringType)),
  Route('bar')[':>'](Post(JSON, AnimalType)),
  Route('bar')[':>'](Put(JSON, AnimalType)),
  Route('bar')[':>'](DeleteNoContent),
);

describe('Alternative', () => {
  const server = toHttpAppIO(alternativeApi, {
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

  it('should union the endpoints', async () => {
    await withServerP(server)(server =>
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
    ).unsafeRunToPromise();
  });

  it('should route based on the accept header', async () => {
    await withServerP(server)(server =>
      test(server)
        .get('/foo')
        .accept('text/plain')
        .then(response => {
          expect(response.statusCode).toBe(200);
          expect(response.text).toBe('a string');
        }),
    ).unsafeRunToPromise();
  });

  it('should return 404 when the path does not exist', async () => {
    await withServerP(server)(server =>
      test(server)
        .get('/non-existent-path')
        .then(response => expect(response.statusCode).toBe(404)),
    ).unsafeRunToPromise();
  });
});
