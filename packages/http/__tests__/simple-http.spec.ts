// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EitherT } from '@fp4ts/cats';
import { IO, IoK } from '@fp4ts/effect';
import { Request, Method, EntityEncoder, uri } from '@fp4ts/http-core';
import {
  Get,
  GetNoContent,
  group,
  PlainText,
  Post,
  ReqBody,
  Route,
  stringType,
} from '@fp4ts/http-dsl';
import { toApp } from '@fp4ts/http-dsl-server';

describe('dsl routing', () => {
  const api = group(
    Route('version')[':>'](GetNoContent),
    Route('ping')[':>'](Get(PlainText, stringType)),
    Route('echo')
      [':>'](ReqBody(PlainText, stringType))
      [':>'](Post(PlainText, stringType)),
  );

  const app = toApp(IO.Concurrent)(
    api,
    [
      EitherT.rightUnit(IO.Applicative),
      EitherT.right(IO.Applicative)('pong'),
      x => EitherT.right(IO.Applicative)(x),
    ],
    {},
  );

  it('should return 204', async () => {
    const response = await app
      .run(new Request(Method.GET, uri`/version`))
      .unsafeRunToPromise();

    expect(response.status.code).toBe(204);
  });

  it('should return pong', async () => {
    const response = await app
      .run(new Request(Method.GET, uri`/ping`))
      .flatMap(response => response.bodyText.compileConcurrent().string)
      .unsafeRunToPromise();

    expect(response).toBe('pong');
  });

  it('should echo the body request', async () => {
    const response = await app
      .run(
        new Request<IoK>(Method.POST, uri`/echo`).withEntity(
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
      .run(new Request(Method.GET, uri`/some/random/uri`))
      .unsafeRunToPromise();

    expect(response.status.code).toBe(404);
  });
});
