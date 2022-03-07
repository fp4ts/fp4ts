// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import fc from 'fast-check';
import { Left, List, None, NonEmptyList, Some } from '@fp4ts/cats';
import { IO, Resource } from '@fp4ts/effect';
import { Method, RawHeader, Status } from '@fp4ts/http-core';
import { ResponseHeaders } from '@fp4ts/http-dsl-client';
import { Client } from '@fp4ts/http-client';
import { NodeClient } from '@fp4ts/http-node-client';
import { withServerClient } from '@fp4ts/http-test-kit-node';
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
  const clientResource = Resource.pure(NodeClient.makeClient(IO.Async));

  describe('Get', () => {
    it.M('should get root', () =>
      withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return getRoot
          .run(client.withBaseUri(baseUri))
          .flatMap(person => IO(() => expect(person).toEqual(carol)));
      }),
    );

    it.M('should get simple endpoint', () =>
      withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return getGet
          .run(client.withBaseUri(baseUri))
          .flatMap(person => IO(() => expect(person).toEqual(alice)));
      }),
    );

    it.M('should get simple endpoint', () =>
      withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return getGet
          .run(client.withBaseUri(baseUri))
          .flatMap(person => IO(() => expect(person).toEqual(alice)));
      }),
    );
  });

  describe('Delete', () => {
    it.M('should perform delete with empty content', () =>
      withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return deleteEmpty
          .run(client.withBaseUri(baseUri))
          .flatMap(res => IO(() => expect(res).toBeUndefined()));
      }),
    );
  });

  describe('Capture', () => {
    it.M('should capture the parameter', () =>
      withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return getCapture('Paula')
          .run(client.withBaseUri(baseUri))
          .flatMap(res =>
            IO(() => expect(res).toEqual(Person({ name: 'Paula', age: 0 }))),
          );
      }),
    );
  });

  describe('Capture All', () => {
    it.M('should capture no parameters', () =>
      withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return getCaptureAll(List.empty)
          .run(client.withBaseUri(baseUri))
          .flatMap(res => IO(() => expect(res).toEqual([])));
      }),
    );

    it.M('should capture a single parameter', () =>
      withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return getCaptureAll(List('Paula'))
          .run(client.withBaseUri(baseUri))
          .flatMap(res =>
            IO(() => expect(res).toEqual([Person({ name: 'Paula', age: 0 })])),
          );
      }),
    );

    it.M('should capture a multiple parameters', () =>
      withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return getCaptureAll(List('Paula', 'Kim', 'Jessica'))
          .run(client.withBaseUri(baseUri))
          .flatMap(res =>
            IO(() =>
              expect(res).toEqual([
                Person({ name: 'Paula', age: 0 }),
                Person({ name: 'Kim', age: 1 }),
                Person({ name: 'Jessica', age: 2 }),
              ]),
            ),
          );
      }),
    );
  });

  describe('Request Body', () => {
    it.M('should pass request body', () =>
      withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;
        const clara = Person({ name: 'Clara', age: 34 });

        return postBody(clara)
          .run(client.withBaseUri(baseUri))
          .flatMap(res => IO(() => expect(res).toEqual(clara)));
      }),
    );
  });

  describe('Query Parameter', () => {
    it.M('should pass query parameter', () =>
      withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return getParam(Some('alice'))
          .run(client.withBaseUri(baseUri))
          .flatMap(res => IO(() => expect(res).toEqual(alice)));
      }),
    );

    it.M('should throw an error on wrong value', () =>
      withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return getParam(Some('Carol'))
          .run(client.withBaseUri(baseUri))
          .attempt.flatMap(res =>
            IO(() =>
              expect(res).toEqual(
                Left(new Error(`Failed with status 400\n'Carol' not found`)),
              ),
            ),
          );
      }),
    );

    it.M('should throw an error on empty value', () =>
      withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return getParam(None)
          .run(client.withBaseUri(baseUri))
          .attempt.flatMap(res =>
            IO(() =>
              expect(res).toEqual(
                Left(new Error('Failed with status 400\nempty parameter')),
              ),
            ),
          );
      }),
    );
  });

  describe('Raw', () => {
    it.M('should respond with success', () =>
      withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return rawSuccess(Method.GET)
          .run(client.withBaseUri(baseUri))
          .flatTap(res => IO(() => expect(res.status === Status.Ok).toBe(true)))
          .flatMap(res => res.bodyText.compileConcurrent().string)
          .flatMap(txt => IO(() => expect(txt).toBe('raw success')));
      }),
    );

    it.M('should respond with failure', () =>
      withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return rawFailure(Method.GET)
          .run(client.withBaseUri(baseUri))
          .flatTap(res =>
            IO(() => expect(res.status === Status.BadRequest).toBe(true)),
          )
          .flatMap(res => res.bodyText.compileConcurrent().string)
          .flatMap(txt => IO(() => expect(txt).toBe('raw failure')));
      }),
    );

    it.M('should attach headers', () =>
      withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;
        const client_ = Client(IO.Async, req =>
          client.run(req.putHeaders(new RawHeader('X-Added-Header', 'XXX'))),
        );

        return rawSuccessPassHeaders(Method.GET)
          .run(client_.withBaseUri(baseUri))
          .flatMap(res =>
            IO(() =>
              expect(res.headers.getRaw('X-Added-Header')).toEqual(
                Some(NonEmptyList('XXX', List.empty)),
              ),
            ),
          );
      }),
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
        withServerClient(
          server,
          clientResource,
        )((server, client) => {
          const baseUri = server.baseUri;

          return postMultiple(str)(num)(flag)(body)
            .run(client.withBaseUri(baseUri))
            .flatMap(res =>
              IO(() =>
                expect(res).toEqual([
                  str,
                  num,
                  flag.getOrElse(() => false),
                  body,
                ]),
              ),
            );
        }),
    ),
  );

  it.M('should attach receive attached headers', () =>
    withServerClient(
      server,
      clientResource,
    )((server, client) => {
      const baseUri = server.baseUri;

      return getHeaders
        .run(client.withBaseUri(baseUri))
        .flatMap(res =>
          IO(() => expect(res).toEqual(new ResponseHeaders([42, 'eg2'], true))),
        );
    }),
  );
});
