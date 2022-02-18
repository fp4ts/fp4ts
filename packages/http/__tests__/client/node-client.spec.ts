// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IO, IOF } from '@fp4ts/effect-core';
import {
  EntityDecoder,
  EntityEncoder,
  HttpApp,
  Method,
  Status,
  uri,
} from '@fp4ts/http-core';
import { NodeClient } from '@fp4ts/http-node-client';
import { serve } from '@fp4ts/http-node-server';

const app = HttpApp<IOF>(req => {
  return '/path1'.startsWith(req.uri.path.components.join('/'))
    ? IO.pure(Status.Ok('path1')(EntityEncoder.text()))
    : '/path2'.startsWith(req.uri.path.components.join('/'))
    ? IO.pure(Status.Ok('path1')(EntityEncoder.text()))
    : req.method === Method.POST &&
      '/echo/payload'.startsWith(req.uri.path.components.join('/'))
    ? IO.pure(Status.Ok<IOF>().withBodyStream(req.body))
    : IO.pure(Status.NotFound<IOF>());
});

describe('test something', () => {
  it('should return a simple payload ', async () => {
    await serve(IO.Async)(app, 3000)
      .use(IO.Async)(() => {
        const client = NodeClient.makeClient(IO.Async);

        return client
          .get(uri`localhost:3000/path1`)
          .fetchAs(EntityDecoder.text(IO.Async))
          .flatMap(resp => IO(() => expect(resp).toEqual('path1')));
      })
      .unsafeRunToPromise();
  });

  it('should echo the payload', async () => {
    await serve(IO.Async)(app, 3000)
      .use(IO.Async)(() => {
        const client = NodeClient.makeClient(IO.Async);

        return client
          .post(uri`localhost:3000/echo/payload`)
          .send('My simple payload', EntityEncoder.text())
          .fetchAs(EntityDecoder.text(IO.Async))
          .flatMap(resp => IO(() => expect(resp).toBe('My simple payload')));
      })
      .unsafeRunToPromise();
  });
});
