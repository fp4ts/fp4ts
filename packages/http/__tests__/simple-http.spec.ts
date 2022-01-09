// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IO, IoK } from '@fp4ts/effect';
import {
  Request,
  HttpRoutes,
  EntityDecoder,
  EntityEncoder,
  uri,
} from '@fp4ts/http-core';
import { GET, NoContent, Ok, POST, Routes } from '@fp4ts/http-dsl';

describe('dsl routing', () => {
  const app = HttpRoutes.orNotFound(IO.Monad)(
    Routes.of(IO.Monad)($ =>
      $.group(
        $(GET, 'version', () => NoContent<IoK>()),
        $(GET, 'ping', () => Ok('pong')(EntityEncoder.text<IoK>())),
        $(POST, 'echo', ({ req }) =>
          req.decode(
            IO.Monad,
            EntityDecoder.text(IO.Concurrent),
          )(body => Ok(body)(EntityEncoder.text<IoK>())),
        ),
      ),
    ),
  );

  it('should return 204', async () => {
    const response = await app
      .run(new Request(GET, uri`/version`))
      .unsafeRunToPromise();

    expect(response.status.code).toBe(204);
  });

  it('should return pong', async () => {
    const response = await app
      .run(new Request(GET, uri`/ping`))
      .flatMap(response => response.bodyText.compileConcurrent().string)
      .unsafeRunToPromise();

    expect(response).toBe('pong');
  });

  it('should echo the body request', async () => {
    const response = await app
      .run(
        new Request<IoK>(POST, uri`/echo`).withEntity(
          'sample payload',
          EntityEncoder.text(),
        ),
      )
      .flatMap(response => response.bodyText.compileConcurrent().string)
      .unsafeRunToPromise();

    expect(response).toBe('sample payload');
  });

  it('should return 404 when route is not found', async () => {
    const response = await app
      .run(new Request(GET, uri`/some/random/uri`))
      .unsafeRunToPromise();

    expect(response.status.code).toBe(404);
  });
});
