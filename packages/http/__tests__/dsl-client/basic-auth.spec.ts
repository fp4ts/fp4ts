// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import { EitherT, Left, Right } from '@fp4ts/cats';
import { IO } from '@fp4ts/effect';
import { BasicCredentials, Request } from '@fp4ts/http-core';
import { NodeClient } from '@fp4ts/http-node-client';
import { withServer } from '@fp4ts/http-test-kit-node';
import {
  builtins,
  ClientM,
  ResponseFailure,
  toClientIn,
} from '@fp4ts/http-dsl-client';
import { alice, basicAuthApi, basicAuthServer, PersonCodable } from './common';

describe('BasicAuth', () => {
  const getBasic = toClientIn(
    IO.Async,
    ClientM.RunClientIO(NodeClient.makeClient(IO.Async)),
    EitherT.rightT(IO.Async),
  )(basicAuthApi, {
    ...builtins,
    'application/json': {
      '@fp4ts/http/__tests__/dsl-client/person': PersonCodable,
    },
  });

  it.M('should succeed when credentials match', () =>
    withServer(basicAuthServer)(server => {
      const baseUri = server.baseUri;

      return getBasic(new BasicCredentials('fp4ts', 'server'))(
        new Request({ uri: baseUri }),
      ).value.flatMap(r => IO(() => expect(r).toEqual(Right(alice))));
    }),
  );

  it.M('should fail with Unauthorized when credentials are mismatched', () =>
    withServer(basicAuthServer)(server => {
      const baseUri = server.baseUri;

      return IO.Monad.do(function* (_) {
        const res = yield* _(
          getBasic(new BasicCredentials('fp4ts', 'wrong'))(
            new Request({ uri: baseUri }),
          ).value,
        );

        expect(res).toEqual(Left(expect.any(ResponseFailure)));
        expect((res.getLeft as any).response.status.code).toBe(401);
      });
    }),
  );
});
