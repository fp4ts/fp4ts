// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import http from 'http';
import { Kind, snd } from '@fp4ts/core';
import { Either, List, Monad } from '@fp4ts/cats';
import { Async, Resource, Dispatcher } from '@fp4ts/effect';
import { Stream } from '@fp4ts/stream';
import * as io from '@fp4ts/stream-io';
import {
  Headers,
  HttpApp,
  Method,
  Uri,
  RawHeader,
  Request,
  Entity,
} from '@fp4ts/http-core';

export const serve =
  <F>(F: Async<F>) =>
  (app: HttpApp<F>, port: number = 3000): Resource<F, http.Server> => {
    const handleConnection = mkConnectionHandler(F)(app);
    const RF = Resource.Async(F);
    return Monad.Do(RF)(function* (_) {
      const dispatcher = yield* _(Dispatcher(F));
      const server = yield* _(
        Resource.makeFull(F)(
          poll =>
            F.delay(() =>
              http.createServer((req, res) =>
                dispatcher.unsafeRunAndForget(poll(handleConnection(req, res))),
              ),
            ),
          s => F.async_(cb => s.close(() => cb(Either.rightUnit))),
        ),
      );
      return server;
    }).evalTap(server =>
      F.async_<void>(cb => server.listen(port, () => cb(Either.rightUnit))),
    );
  };

const mkConnectionHandler =
  <F>(F: Async<F>) =>
  (app: HttpApp<F>) =>
  (req: http.IncomingMessage, res: http.ServerResponse): Kind<F, [void]> =>
    Monad.Do(F)(function* (_) {
      const method = yield* _(
        F.fromEither(Method.fromString(req.method ?? '')),
      );
      const uri = yield* _(F.fromEither(Uri.fromString(req.url ?? '')));
      const headers = incomingHeadersToHeaders(req.headers);
      const body = Stream.resource(F)(
        io.suspendReadableAndRead(F)()(() => req),
      ).flatMap(snd);

      const request = new Request(
        method,
        uri,
        '1.1',
        headers,
        new Entity(body),
      );
      const response = yield* _(app.run(request));

      yield* _(
        F.delay(() => {
          const headers = headersToOutgoingHeaders(response.headers);
          res.writeHead(response.status.code, response.status.name, headers);
        }),
      );
      yield* _(
        response.body
          .through(io.writeWritable(F)(F.pure(res)))
          .compileConcurrent(F).drain,
      );
    });

const incomingHeadersToHeaders = (hs: http.IncomingHttpHeaders): Headers => {
  const rawHeaders: RawHeader[] = [];
  for (const [k, val] of Object.entries(hs)) {
    if (val === undefined) continue;
    if (Array.isArray(val)) {
      rawHeaders.push(...val.map(v => new RawHeader(k, v)));
    } else {
      rawHeaders.push(new RawHeader(k, val));
    }
  }
  return new Headers(List.fromArray(rawHeaders));
};

const headersToOutgoingHeaders = (hs: Headers): http.OutgoingHttpHeaders => {
  const outgoingHeaders: http.OutgoingHttpHeaders = {};
  for (const { headerName, headerValue } of hs.headers.toArray) {
    if (Array.isArray(outgoingHeaders[headerName])) {
      (outgoingHeaders[headerName] as any).push(headerValue);
    }
    if (typeof outgoingHeaders[headerName] === 'string') {
      outgoingHeaders[headerName] = [
        outgoingHeaders[headerName] as any,
        headerValue,
      ];
    }
    outgoingHeaders[headerName] = headerValue;
  }
  return outgoingHeaders;
};
