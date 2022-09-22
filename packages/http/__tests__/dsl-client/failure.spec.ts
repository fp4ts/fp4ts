// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import { Left } from '@fp4ts/cats';
import { IO } from '@fp4ts/effect';
import { ContentType, MediaType, Request, Response } from '@fp4ts/http-core';
import {
  ClientDecodeFailure,
  ContentTypeFailure,
  ResponseFailure,
} from '@fp4ts/http-dsl-client';
import { withServer } from '@fp4ts/http-test-kit-node';
import { alice, deleteEmpty, failServer, getCapture, postBody } from './common';

describe('Failure', () => {
  describe('client reports failures appropriately', () => {
    it.M('should respond with 404 Not Found', () =>
      withServer(failServer)(server => {
        const uri = server.baseUri;

        return IO.Monad.do(function* (_) {
          const res = yield* _(deleteEmpty(new Request({ uri })));
          expect(res).toEqual(Left(expect.any(ResponseFailure)));
          expect((res.getLeft as any).response.status.code).toBe(404);
        });
      }),
    );

    it.M('should return a decode failure', () =>
      withServer(failServer)(server =>
        getCapture('foo')(new Request({ uri: server.baseUri })).map(res =>
          expect(res).toEqual(Left(expect.any(ClientDecodeFailure))),
        ),
      ),
    );

    // it.skip('should respond with a connection failure', () =>
    //   withServer(failServer)(server => {
    //     const baseUri = server.baseUri.copy({
    //       authority: Some(
    //         new Authority(
    //           'localhost',
    //           Some(
    //             server.baseUri.authority
    //               .flatMap(aut => aut.port.map(p => p + 1))
    //               .getOrElse(() => 19763),
    //           ),
    //         ),
    //       ),
    //     });

    //     return getCapture('foo')(new Request({ uri: baseUri })).map(res =>
    //       expect(res.getLeft).toBeInstanceOf(ConnectionFailure),
    //     );
    //   }));

    it.M('should respond with a Unsupported Media Type', () =>
      withServer(failServer)(server =>
        postBody(alice)(new Request({ uri: server.baseUri })).map(res =>
          expect(res).toEqual(
            Left(
              new ContentTypeFailure(
                new ContentType(new MediaType('foooo', 'bar')),
                expect.any(Response),
              ),
            ),
          ),
        ),
      ),
    );
  });
});
