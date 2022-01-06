// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import test from 'supertest';
import { EitherT, Kleisli, List, Right } from '@fp4ts/cats';
import { IO, IoK } from '@fp4ts/effect';
import { DecoderT } from '@fp4ts/schema';
import { Method, Status, EntityEncoder, EntityDecoder } from '@fp4ts/http-core';
import { PathComponent, Route, ServerRouter } from '@fp4ts/http-routing';
import { NodeServer } from '@fp4ts/http-node-server';

describe('node-server', () => {
  const stringDecoder = new EntityDecoder<IoK, string>(
    DecoderT(m =>
      EitherT(m.bodyText.compileConcurrent(IO.Async).string.map(Right)),
    ),
    new Set(),
  );

  const app = new ServerRouter<IoK>()
    .registerRoutes(
      List(
        new Route(
          Method.GET,
          PathComponent.fromUriString('/version'),
          Kleisli(() => IO.pure(Status.Ok())),
        ),
        new Route(
          Method.GET,
          PathComponent.fromUriString('/ping'),
          Kleisli(() => IO.pure(Status.Ok('pong')(EntityEncoder.text()))),
        ),
        new Route(
          Method.POST,
          PathComponent.fromUriString('/echo'),
          Kleisli(req =>
            req.decodeWith(IO.Monad)(stringDecoder, s =>
              IO.pure(Status.Ok(s)(EntityEncoder.text())),
            ),
          ),
        ),
      ),
    )
    .get.toHttpApp(IO.Monad);

  const server = NodeServer.make(IO.Async)(app);

  it('should return OK 200', async () => {
    await server
      .use(IO.MonadCancel)(server =>
        server
          .listen(3000)
          .flatMap(() =>
            IO.deferPromise(() => test(server.server).get('/version').send()),
          )
          .flatMap(response => IO(() => expect(response.statusCode).toBe(200))),
      )
      .unsafeRunToPromise();
  });

  it('should return pong', async () => {
    await server
      .use(IO.MonadCancel)(server =>
        server
          .listen(3000)
          .flatMap(() =>
            IO.deferPromise(() => test(server.server).get('/ping').send()),
          )
          .flatMap(response => IO(() => expect(response.text).toBe('pong'))),
      )
      .unsafeRunToPromise();
  });

  it('should echo the payload', async () => {
    await server
      .use(IO.MonadCancel)(server =>
        server
          .listen(3000)
          .flatMap(() =>
            IO.deferPromise(() =>
              test(server.server).post('/echo').send('hello fp4ts'),
            ),
          )
          .flatMap(response =>
            IO(() => expect(response.text).toBe('hello fp4ts')),
          ),
      )
      .unsafeRunToPromise();
  });
});
