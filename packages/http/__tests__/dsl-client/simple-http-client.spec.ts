// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import fc from 'fast-check';
import { stringType } from '@fp4ts/core';
import { Either, Right } from '@fp4ts/cats';
import { IO, Resource } from '@fp4ts/effect';
import { Request } from '@fp4ts/http-core';
import { builtins, ClientM, toClientIn } from '@fp4ts/http-dsl-client';
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
import { withServer } from '@fp4ts/http-test-kit-node';

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

const [version, ping, echo] = toClientIn(
  ClientM.RunClientIO(NodeClient.makeClient(IO.Async)),
)(api, builtins);

describe('Simple HTTP api dsl client', () => {
  const clientResource = Resource.pure(NodeClient.makeClient(IO.Async));

  it.M('should respond with a unit response', () =>
    withServer(app)(server => {
      const baseUri = server.baseUri;
      return version(new Request({ uri: baseUri })).flatMap(resp =>
        IO(() => expect(resp).toEqual(Either.rightUnit)),
      );
    }),
  );

  it.M("should respond with a 'pong'", () =>
    withServer(app)(server => {
      const baseUri = server.baseUri;
      return ping(new Request({ uri: baseUri })).flatMap(resp =>
        IO(() => expect(resp).toEqual(Right('pong'))),
      );
    }),
  );

  it('should respond with sent payload', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), s =>
        withServer(app)(server => {
          const baseUri = server.baseUri;
          return echo(s)(new Request({ uri: baseUri })).flatMap(resp =>
            IO(() => expect(resp).toEqual(Right(s))),
          );
        }).unsafeRunToPromise(),
      ),
    );
  });
});
