// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import fc from 'fast-check';
import { stringType } from '@fp4ts/core';
import { IO } from '@fp4ts/effect-core';
import { Resource } from '@fp4ts/effect-kernel';
import { builtins, toClientIOIn } from '@fp4ts/http-dsl-client';
import { toHttpAppIO } from '@fp4ts/http-dsl-server';
import {
  Get,
  GetNoContent,
  group,
  PlainText,
  Post,
  ReqBody,
  Route,
} from '@fp4ts/http-dsl-shared';
import { NodeClient } from '@fp4ts/http-node-client';
import { withServerClient } from '@fp4ts/http-test-kit-node';
import { Request } from '@fp4ts/http-core';

const api = group(
  Route('version')[':>'](GetNoContent),
  Route('ping')[':>'](Get(PlainText, stringType)),
  Route('echo')
    [':>'](ReqBody(PlainText, stringType))
    [':>'](Post(PlainText, stringType)),
);

const app = toHttpAppIO(
  api,
  builtins,
)(S => [S.unit, S.return('pong'), S.return]);

const [version, ping, echo] = toClientIOIn(api, builtins);

describe('Simple HTTP api dsl client', () => {
  const clientResource = Resource.pure(NodeClient.makeClient(IO.Async));

  it.M('should respond with a unit response', () =>
    withServerClient(
      app,
      clientResource,
    )((server, client) => {
      const baseUri = server.baseUri;
      return version(new Request())
        .run(client.withBaseUri(baseUri))
        .flatMap(resp => IO(() => expect(resp).toBeUndefined()));
    }),
  );

  it.M("should respond with a 'pong'", () =>
    withServerClient(
      app,
      clientResource,
    )((server, client) => {
      const baseUri = server.baseUri;
      return ping(new Request())
        .run(client.withBaseUri(baseUri))
        .flatMap(resp => IO(() => expect(resp).toBe('pong')));
    }),
  );

  it('should respond with sent payload', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), s =>
        withServerClient(
          app,
          clientResource,
        )((server, client) => {
          const baseUri = server.baseUri;
          return echo(s)(new Request())
            .run(client.withBaseUri(baseUri))
            .flatMap(resp => IO(() => expect(resp).toBe(s)));
        }).unsafeRunToPromise(),
      ),
    );
  });
});
