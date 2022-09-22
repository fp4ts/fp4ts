// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import fc from 'fast-check';
import {
  Either,
  EitherT,
  Left,
  List,
  None,
  NonEmptyList,
  Right,
  Some,
} from '@fp4ts/cats';
import { IO, IOF, Resource } from '@fp4ts/effect';
import { RawHeader, Request, Status } from '@fp4ts/http-core';
import { Client } from '@fp4ts/http-client';
import { ResponseHeaders, ResponseFailure } from '@fp4ts/http-dsl-client';
import { NodeClient } from '@fp4ts/http-node-client';
import { withServer, withServerClient } from '@fp4ts/http-test-kit-node';
import { forAllM } from '@fp4ts/effect-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import {
  alice,
  carol,
  deleteEmpty,
  getCapture,
  getCaptureAll,
  getGet,
  getHeaders,
  getParam,
  getRoot,
  Person,
  postBody,
  postMultiple,
  rawFailure,
  rawSuccess,
  rawSuccessPassHeaders,
  server,
} from './common';

describe('Success', () => {
  const clientResource = Resource.pure<IOF, Client<IOF>>(
    NodeClient.makeClient(IO.Async),
  );

  describe('Get', () => {
    it.M('should get root', () =>
      withServer(server)(server =>
        getRoot(new Request({ uri: server.baseUri })).map(person =>
          expect(person).toEqual(Right(carol)),
        ),
      ),
    );

    it.M('should get simple endpoint', () =>
      withServer(server)(server =>
        getGet(new Request({ uri: server.baseUri })).map(person =>
          expect(person).toEqual(Right(alice)),
        ),
      ),
    );

    it.M('should get simple endpoint', () =>
      withServer(server)(server =>
        getGet(new Request({ uri: server.baseUri })).map(person =>
          expect(person).toEqual(Right(alice)),
        ),
      ),
    );
  });

  describe('Delete', () => {
    it.M('should perform delete with empty content', () =>
      withServer(server)(server =>
        deleteEmpty(new Request({ uri: server.baseUri })).map(res =>
          expect(res).toEqual(Either.rightUnit),
        ),
      ),
    );
  });

  describe('Capture', () => {
    it.M('should capture the parameter', () =>
      withServer(server)(server =>
        getCapture('Paula')(new Request({ uri: server.baseUri })).map(res =>
          expect(res).toEqual(Right(Person({ name: 'Paula', age: 0 }))),
        ),
      ),
    );
  });

  describe('Capture All', () => {
    it.M('should capture no parameters', () =>
      withServer(server)(server =>
        getCaptureAll(List.empty)(new Request({ uri: server.baseUri })).map(
          res => expect(res).toEqual(Right([])),
        ),
      ),
    );

    it.M('should capture a single parameter', () =>
      withServer(server)(server =>
        getCaptureAll(List('Paula'))(new Request({ uri: server.baseUri })).map(
          res =>
            expect(res).toEqual(Right([Person({ name: 'Paula', age: 0 })])),
        ),
      ),
    );

    it.M('should capture a multiple parameters', () =>
      withServer(server)(server =>
        getCaptureAll(List('Paula', 'Kim', 'Jessica'))(
          new Request({ uri: server.baseUri }),
        ).map(res =>
          expect(res).toEqual(
            Right([
              Person({ name: 'Paula', age: 0 }),
              Person({ name: 'Kim', age: 1 }),
              Person({ name: 'Jessica', age: 2 }),
            ]),
          ),
        ),
      ),
    );
  });

  describe('Request Body', () => {
    it.M('should pass request body', () =>
      withServer(server)(server => {
        const uri = server.baseUri;
        const clara = Person({ name: 'Clara', age: 34 });

        return postBody(clara)(new Request({ uri })).map(res =>
          expect(res).toEqual(Right(clara)),
        );
      }),
    );
  });

  describe('Query Parameter', () => {
    it.M('should pass query parameter', () =>
      withServer(server)(server =>
        getParam(Some('alice'))(new Request({ uri: server.baseUri })).map(res =>
          expect(res).toEqual(Right(alice)),
        ),
      ),
    );

    it.M('should throw an error on wrong value', () =>
      withServer(server)(server =>
        IO.Monad.do(function* (_) {
          const res = yield* _(
            getParam(Some('Carol'))(new Request({ uri: server.baseUri })),
          );

          expect(res).toEqual(Left(expect.any(ResponseFailure)));
          expect((res.getLeft as any).response.status.code).toBe(400);
        }),
      ),
    );

    it.M('should throw an error on empty value', () =>
      withServer(server)(server =>
        IO.Monad.do(function* (_) {
          const res = yield* _(
            getParam(None)(new Request({ uri: server.baseUri })),
          );

          expect(res).toEqual(Left(expect.any(ResponseFailure)));
          expect((res.getLeft as any).response.status.code).toBe(400);
        }),
      ),
    );
  });

  describe('Raw', () => {
    it.M('should respond with success', () =>
      withServerClient(
        server,
        clientResource,
      )((server, client) =>
        rawSuccess(req => EitherT.liftF(IO.Monad)(client.fetch(req, IO.pure)))(
          new Request({ uri: server.baseUri }),
        )
          .flatTap(res =>
            IO(() => expect(res.get.status === Status.Ok).toBe(true)),
          )
          .flatMap(res => res.get.bodyText.compileConcurrent().string)
          .map(txt => expect(txt).toBe('raw success')),
      ),
    );

    it.M('should respond with failure', () =>
      withServerClient(
        server,
        clientResource,
      )((server, client) =>
        rawFailure(req => EitherT.liftF(IO.Monad)(client.fetch(req, IO.pure)))(
          new Request({ uri: server.baseUri }),
        )
          .flatTap(res =>
            IO(() => expect(res.get.status === Status.BadRequest).toBe(true)),
          )
          .flatMap(res => res.get.bodyText.compileConcurrent().string)
          .map(txt => expect(txt).toBe('raw failure')),
      ),
    );

    it.M('should attach headers', () =>
      withServerClient(
        server,
        clientResource,
      )((server, client) =>
        rawSuccessPassHeaders(req =>
          EitherT.liftF(IO.Monad)(
            client.fetch(
              req.putHeaders(new RawHeader('X-Added-Header', 'XXX')),
              IO.pure,
            ),
          ),
        )(new Request({ uri: server.baseUri })).map(res =>
          expect(res.get.headers.getRaw('X-Added-Header')).toEqual(
            Some(NonEmptyList('XXX', List.empty)),
          ),
        ),
      ),
    );
  });

  test.M(
    'Combinations of Capture, Query and ReqBody',
    forAllM(
      fc.webSegment().filter(s => s.length > 0),
      A.fp4tsOption(fc.integer()),
      A.fp4tsOption(fc.boolean()),
      fc.tuple(fc.string(), fc.array(fc.integer())),
      (str, num, flag, body) =>
        withServer(server)(server =>
          postMultiple(str)(num)(flag)(body)(
            new Request({ uri: server.baseUri }),
          ).map(res =>
            expect(res).toEqual(
              Right([str, num, flag.getOrElse(() => false), body]),
            ),
          ),
        ),
    ),
  );

  it.M('should attach receive attached headers', () =>
    withServer(server)(server =>
      getHeaders(new Request({ uri: server.baseUri })).map(res =>
        expect(res).toEqual(Right(new ResponseHeaders([42, 'eg2'], true))),
      ),
    ),
  );
});
