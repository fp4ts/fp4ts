// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import { stringType, tupled } from '@fp4ts/core';
import { Monad } from '@fp4ts/cats';
import { List } from '@fp4ts/collections';
import { Resource, IO, IOF } from '@fp4ts/effect';
import { Stream, text } from '@fp4ts/stream';
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
import { builtins, toHttpAppIO } from '@fp4ts/http-dsl-server';
import { group, Header, Raw, Route } from '@fp4ts/http-dsl-shared';
import { withServerClient } from '@fp4ts/http-test-kit-node';
import { GetRoutes, SimplePath } from './get-routes';

const api = group(
  Route('request-splitting')[':>'](Header('Evil', stringType)[':>'](Raw)),
  Raw,
);

export function clientRouteSuite(
  name: string,
  clientResource: Resource<IOF, Client<IOF>>,
) {
  const app = toHttpAppIO(
    api,
    builtins,
  )(() => [
    h =>
      HttpApp(() =>
        h
          .map(() => IO.pure(Status.InternalServerError<IOF>()))
          .getOrElse(() => IO.pure(Status.Ok())),
      ),
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

    it.M('should repeat a single request', () =>
      serverClient((server, client) => {
        const port = server.address.port;

        const url = uri`http://localhost:${port}/${SimplePath}`;
        return IO.parTraverse_(List.TraversableFilter)(List.range(0, 10), () =>
          client.get(url).fetchAs(EntityDecoder.text(IO.Async)),
        ).flatMap(xs =>
          IO(() => expect(xs.all(x => x.length === 0)).toBe(true)),
        ).void;
      }),
    );

    it.M('should POST an empty body', () =>
      serverClient((server, client) => {
        const port = server.address.port;

        const url = uri`http://localhost:${port}/echo`;
        return client
          .post(url)
          .fetchAs(EntityDecoder.text(IO.Async))
          .flatMap(body => IO(() => expect(body).toBe('')));
      }),
    );

    it.M('should POST a regular body', () =>
      serverClient((server, client) => {
        const port = server.address.port;

        const url = uri`http://localhost:${port}/echo`;
        return client
          .post(url)
          .send('Normal body', EntityEncoder.text())
          .fetchAs(EntityDecoder.text(IO.Async))
          .flatMap(body => IO(() => expect(body).toBe('Normal body')));
      }),
    );

    it.M('should POST a chunked body', () =>
      serverClient((server, client) => {
        const port = server.address.port;

        const url = uri`http://localhost:${port}/echo`;
        const body = Stream.fromArray<IOF, string>('Chunked body'.split(''))
          .covary<IOF>()
          .through(text.utf8.encode());
        return client
          .post(url)
          .send(body)
          .fetchAs(EntityDecoder.text(IO.Async))
          .flatMap(body => IO(() => expect(body).toBe('Chunked body')));
      }),
    );

    GetRoutes.forEach((expected, path) => {
      it.M(`should execute GET ${path}`, () =>
        serverClient((server, client) => {
          const port = server.address.port;

          const url = uri`http://localhost:${port}${path}`;
          return client
            .get(url)
            .fetch(rec => expected.flatMap(exp => checkResponse(rec, exp)));
        }),
      );
    });

    it.M('should mitigate request splitting attack in the URI path', () =>
      serverClient((server, client) => {
        const port = server.address.port;

        const url = uri`http://localhost:${port}/request-splitting HTTP/1.0\r\nEvil:true\r\nHide-Protocol-Version:`;
        return client
          .get(url)
          .fetch(req => IO.pure(req.status))
          .handleError(() => Status.NotFound)
          .flatMap(status =>
            IO(() => expect(status.code).toBe(Status.NotFound.code)),
          );
      }),
    );

    it.skip('should mitigate request splitting attack in the host name', async () => {
      await serverClient((server, client) => {
        const port = server.address.port;

        const url = uri`http://localhost\r\nEvil:true\r\n:${port}/request-splitting`;
        return client
          .get(url)
          .fetch(req => IO.pure(req.status))
          .handleError(() => Status.NotFound)
          .flatMap(status =>
            IO(() => expect(status.code).toBe(Status.NotFound.code)),
          );
      }).unsafeRunToPromise();
    });

    it.M(
      'should mitigate request splitting attack in the header field name',
      () =>
        serverClient((server, client) => {
          const port = server.address.port;

          const url = uri`http://localhost:${port}/request-splitting`;
          return client
            .get(url)
            .set('Fine:\r\nEvil:true\r\n', 'oops')
            .fetch(req => IO.pure(req.status))
            .handleError(() => Status.Ok)
            .flatMap(status =>
              IO(() => expect(status.code).toBe(Status.Ok.code)),
            );
        }),
    );

    it.M(
      'should mitigate request splitting attack in the header field value (raw)',
      () =>
        serverClient((server, client) => {
          const port = server.address.port;

          const url = uri`http://localhost:${port}/request-splitting`;
          return client
            .get(url)
            .set('X-Carrier', '\r\nEvil:true\r\n')
            .fetch(req => IO.pure(req.status))
            .handleError(() => Status.Ok)
            .flatMap(status =>
              IO(() => expect(status.code).toBe(Status.Ok.code)),
            );
        }),
    );

    it.M(
      'should mitigate request splitting attack in the header field value (encoded)',
      () =>
        serverClient((server, client) => {
          const port = server.address.port;

          const url = uri`http://localhost:${port}/request-splitting`;
          return client
            .get(url)
            .set('X-Carrier', encodeURI('\r\nEvil:true\r\n'))
            .fetch(req => IO.pure(req.status))
            .onError(e => IO(() => console.log(e)))
            .handleError(() => Status.Ok)
            .flatMap(status =>
              IO(() => expect(status.code).toBe(Status.Ok.code)),
            );
        }),
    );
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
    expect(diffHs).toEqual(List.empty);
    expect(rec.httpVersion).toEqual(exp.httpVersion);
  });
}
