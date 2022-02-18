// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List, Monad } from '@fp4ts/cats';
import { stringType, tupled } from '@fp4ts/core';
import { Resource, IO, IOF } from '@fp4ts/effect';
import {
  EntityDecoder,
  EntityEncoder,
  HttpApp,
  Method,
  Response,
  Status,
  uri,
} from '@fp4ts/http-core';
import { Client } from '@fp4ts/http-client';
import { toHttpAppIO } from '@fp4ts/http-dsl-server';
import { group, Header, Raw, Route } from '@fp4ts/http-dsl-shared';
import { serverPort, withServerClient } from '@fp4ts/http-test-kit-node';
import { Stream, text } from '@fp4ts/stream';
import { GetRoutes, SimplePath } from './get-routes';

const api = group(
  Route('request-splitting')[':>'](Header('Evil', stringType)[':>'](Raw)),
  Route('request-splitting')[':>'](Raw),
  Raw,
);

export function clientRouteSuite(
  name: string,
  clientResource: Resource<IOF, Client<IOF>>,
) {
  const app = toHttpAppIO(
    api,
    {},
  )(() => [
    () => HttpApp(() => IO.pure(Status.InternalServerError())),
    HttpApp(() => IO.pure(Status.Ok())),
    HttpApp(req =>
      req.method === Method.GET
        ? GetRoutes.lookup(req.uri.path.components.join('/')).getOrElse(() =>
            IO.pure(Status.NotFound()),
          )
        : IO.pure(Status.Ok<IOF>().withBodyStream(req.body)),
    ),
  ]);

  describe(name, () => {
    const serverClient = withServerClient(app, clientResource);

    it('should repeat a single request', async () => {
      await serverClient((server, client) => {
        const port = serverPort(server);

        const url = uri`http://localhost:${port}/${SimplePath}`;
        return IO.parTraverse_(List.Traversable)(List.range(0, 10), () =>
          client.get(url).fetchAs(EntityDecoder.text(IO.Async)),
        ).flatMap(xs =>
          IO(() => expect(xs.all(x => x.length === 0)).toBe(true)),
        ).void;
      }).unsafeRunToPromise();
    });

    it('should POST an empty body', async () => {
      await serverClient((server, client) => {
        const port = serverPort(server);

        const url = uri`http://localhost:${port}/echo`;
        return client
          .post(url)
          .fetchAs(EntityDecoder.text(IO.Async))
          .flatMap(body => IO(() => expect(body).toBe('')));
      }).unsafeRunToPromise();
    });

    it('should POST a regular body', async () => {
      await serverClient((server, client) => {
        const port = serverPort(server);

        const url = uri`http://localhost:${port}/echo`;
        return client
          .post(url)
          .send('Normal body', EntityEncoder.text())
          .fetchAs(EntityDecoder.text(IO.Async))
          .flatMap(body => IO(() => expect(body).toBe('Normal body')));
      }).unsafeRunToPromise();
    });

    it('should POST a chunked body', async () => {
      await serverClient((server, client) => {
        const port = serverPort(server);

        const url = uri`http://localhost:${port}/echo`;
        const body = Stream.fromArray('Chunked body'.split(''))
          .covary<IOF>()
          .through(text.utf8.encode());
        return client
          .post(url)
          .send(body)
          .fetchAs(EntityDecoder.text(IO.Async))
          .flatMap(body => IO(() => expect(body).toBe('Chunked body')));
      }).unsafeRunToPromise();
    });

    GetRoutes.forEach((expected, path) => {
      it(`should execute GET ${path}`, async () => {
        await serverClient((server, client) => {
          const port = serverPort(server);

          const url = uri`http://localhost:${port}${path}`;
          return client
            .get(url)
            .fetch(rec => expected.flatMap(exp => checkResponse(rec, exp)));
        }).unsafeRunToPromise();
      });
    });
  });
}

function checkResponse(rec: Response<IOF>, exp: Response<IOF>): IO<void> {
  return Monad.Do(IO.Monad)(function* (_) {
    yield* _(IO(() => expect(rec.status.name).toEqual(exp.status.name)));
    yield* _(IO(() => expect(rec.status.code).toEqual(exp.status.code)));

    const recBody = yield* _(rec.body.compileConcurrent().toArray);
    const expBody = yield* _(exp.body.compileConcurrent().toArray);
    yield* _(IO(() => expect(recBody).toEqual(expBody)));

    const hds = rec.headers.headers.map(r =>
      tupled(r.headerName, r.headerValue),
    );
    const expHds = rec.headers.headers.map(r =>
      tupled(r.headerName, r.headerValue),
    );
    const diffHs = expHds.filter(
      ([n, v]) => !hds.any(h => h[0] === n && h[1] === v),
    );
    yield* _(IO(() => expect(diffHs).toEqual(List.empty)));
    yield* _(IO(() => expect(rec.httpVersion).toEqual(exp.httpVersion)));
  });
}
