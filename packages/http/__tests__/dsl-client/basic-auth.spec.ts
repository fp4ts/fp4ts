// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import { Left } from '@fp4ts/cats';
import { IO, Resource } from '@fp4ts/effect';
import { BasicCredentials } from '@fp4ts/http-core';
import { NodeClient } from '@fp4ts/http-node-client';
import { withServerClient } from '@fp4ts/http-test-kit-node';
import { alice, basicAuthApi, basicAuthServer, PersonCodable } from './common';
import { builtins, toClientIOIn } from '@fp4ts/http-dsl-client';

describe('BasicAuth', () => {
  const clientResource = Resource.pure(NodeClient.makeClient(IO.Async));
  const getBasic = toClientIOIn(basicAuthApi, {
    ...builtins,
    'application/json': {
      '@fp4ts/http/__tests__/dsl-client/person': PersonCodable,
    },
  });

  it.M('should succeed when credentials match', () =>
    withServerClient(
      basicAuthServer,
      clientResource,
    )((server, client) => {
      const baseUri = server.baseUri;

      return getBasic(new BasicCredentials('fp4ts', 'server'))
        .run(client.withBaseUri(baseUri))
        .flatMap(r => IO(() => expect(r).toEqual(alice)));
    }),
  );

  it.M('should fail with Unauthorized when credentials are mismatched', () =>
    withServerClient(
      basicAuthServer,
      clientResource,
    )((server, client) => {
      const baseUri = server.baseUri;

      return getBasic(new BasicCredentials('fp4ts', 'wrong'))
        .run(client.withBaseUri(baseUri))
        .attempt.flatMap(r =>
          IO(() =>
            expect(r).toEqual(
              Left(new Error('Failed with status 401\nUnauthorized')),
            ),
          ),
        );
    }),
  );
});
