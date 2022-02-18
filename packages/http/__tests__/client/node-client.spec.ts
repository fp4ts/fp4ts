// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IO, IOF, Resource } from '@fp4ts/effect';
import {
  EntityDecoder,
  EntityEncoder,
  HttpApp,
  Method,
  Status,
  uri,
} from '@fp4ts/http-core';
import { NodeClient } from '@fp4ts/http-node-client';
import { serverPort, withServer } from '@fp4ts/http-test-kit-node';
import { clientRouteSuite } from './client-route-suite';

const app = HttpApp<IOF>(req => {
  return '/path1'.startsWith(req.uri.path.components.join('/'))
    ? IO.pure(Status.Ok('path1')(EntityEncoder.text()))
    : '/path2'.startsWith(req.uri.path.components.join('/'))
    ? IO.pure(Status.Ok('path1')(EntityEncoder.text()))
    : req.method === Method.POST &&
      '/echo/payload'.startsWith(req.uri.path.components.join('/'))
    ? IO.pure(Status.Ok<IOF>().withBodyStream(req.body))
    : IO.pure(Status.NotFound('Not Found')(EntityEncoder.text()));
});

describe('Node Client', () => {
  it('should perform a simple request', async () => {
    await withServer(app)(server => {
      const port = serverPort(server);
      const client = NodeClient.makeClient(IO.Async);

      return client
        .get(uri`localhost:${port}/path1`)
        .fetchAs(EntityDecoder.text(IO.Async))
        .flatMap(resp => IO(() => expect(resp).toEqual('path1')));
    }).unsafeRunToPromise();
  });

  it('should echo the payload', async () => {
    await withServer(app)(server => {
      const port = serverPort(server);
      const client = NodeClient.makeClient(IO.Async);

      return client
        .post(uri`localhost:${port}/echo/payload`)
        .send('My simple payload', EntityEncoder.text())
        .fetchAs(EntityDecoder.text(IO.Async))
        .flatMap(resp => IO(() => expect(resp).toBe('My simple payload')));
    }).unsafeRunToPromise();
  });

  it('should return 404', async () => {
    await withServer(app)(server => {
      const port = serverPort(server);
      const client = NodeClient.makeClient(IO.Async);

      return client
        .post(uri`localhost:${port}/non/existing/route`)
        .send('My simple payload', EntityEncoder.text())
        .fetchAs(EntityDecoder.text(IO.Async))
        .flatMap(resp => IO(() => expect(resp).toBe('Not Found')));
    }).unsafeRunToPromise();
  });

  clientRouteSuite(
    'node-client',
    Resource.pure(NodeClient.makeClient(IO.Async)),
  );
});
