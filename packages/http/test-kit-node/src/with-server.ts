// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import http from 'http';
import { IO, IOF, Resource } from '@fp4ts/effect';
import { HttpApp } from '@fp4ts/http-core';
import { serve } from '@fp4ts/http-node-server';
import { Client } from '@fp4ts/http-client';
import { Server } from '@fp4ts/http-server';

export const withServer =
  (app: HttpApp<IOF>) =>
  (run: (server: Server) => IO<void>): IO<void> =>
    serve(IO.Async)(app).use(IO.Async)(run);

export const withServerP =
  (app: HttpApp<IOF>) =>
  (run: (server: http.Server) => Promise<void>): IO<void> =>
    serve(IO.Async)(app).use(IO.Async)(server =>
      IO.deferPromise(() => run(server.underlying)),
    );

export const withServerClient =
  (app: HttpApp<IOF>, client: Resource<IOF, Client<IOF>>) =>
  (run: (server: Server, client: Client<IOF>) => IO<void>): IO<void> =>
    serve(IO.Async)(app)
      .flatMap(server => client.map(client => [server, client] as const))
      .use(IO.Async)(([s, c]) => run(s, c));

export const serverPort = (server: http.Server): number =>
  (server.address() as any).port;
