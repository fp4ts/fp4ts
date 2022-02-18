// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import http from 'http';
import { Kind, snd } from '@fp4ts/core';
import { Either, Monad } from '@fp4ts/cats';
import { Async, Resource, Dispatcher } from '@fp4ts/effect';
import { Stream } from '@fp4ts/stream';
import * as io from '@fp4ts/stream-io';
import { HttpApp, Method, Uri, Request } from '@fp4ts/http-core';
import {
  headersToOutgoingHeaders,
  incomingHeadersToHeaders,
} from '@fp4ts/http-node-shared';

export const serve =
  <F>(F: Async<F>) =>
  (app: HttpApp<F>, port?: number): Resource<F, http.Server> => {
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

      const request = new Request(method, uri, '1.1', headers, body);
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
