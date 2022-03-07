// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import { Left, Some } from '@fp4ts/cats';
import { IO, Resource } from '@fp4ts/effect';
import { Authority, ParsingFailure } from '@fp4ts/http-core';
import { NodeClient } from '@fp4ts/http-node-client';
import { withServerClient } from '@fp4ts/http-test-kit-node';
import { alice, deleteEmpty, failServer, getCapture, postBody } from './common';

describe('Failure', () => {
  const clientResource = Resource.pure(NodeClient.makeClient(IO.Async));

  describe('client reports failures appropriately', () => {
    it.M('should respond with 404 Not Found', () =>
      withServerClient(
        failServer,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return deleteEmpty
          .run(client.withBaseUri(baseUri))
          .attempt.flatMap(r =>
            IO(() =>
              expect(r).toEqual(Left(new Error('Failed with status 404'))),
            ),
          );
      }),
    );

    it.M('should respond with a parsing failure', () =>
      withServerClient(
        failServer,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return getCapture('foo')
          .run(client.withBaseUri(baseUri))
          .attempt.flatMap(r =>
            IO(() => expect(r.getLeft).toBeInstanceOf(ParsingFailure)),
          );
      }),
    );

    it.skip('should respond with a connection failure', () =>
      withServerClient(
        failServer,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri.copy({
          authority: Some(
            new Authority(
              'localhost',
              Some(
                server.baseUri.authority
                  .flatMap(aut => aut.port.map(p => p + 1))
                  .getOrElse(() => 19763),
              ),
            ),
          ),
        });

        return getCapture('foo')
          .run(client.withBaseUri(baseUri))
          .attempt.flatMap(r =>
            IO(() => {
              const code = (r.getLeft as any).code;
              expect(code === 'EINVAL' || code === 'ECONNREFUSED').toBe(true);
            }),
          );
      }));

    it.M('should respond with a Unsupported Media Type', () =>
      withServerClient(
        failServer,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return postBody(alice)
          .run(client.withBaseUri(baseUri))
          .attempt.flatMap(r =>
            IO(() =>
              expect(r.getLeft).toEqual(new Error('Unsupported media type')),
            ),
          );
      }),
    );
  });
});
