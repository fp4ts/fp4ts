// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Left, List, None, NonEmptyList, Some } from '@fp4ts/cats';
import { IO, Resource } from '@fp4ts/effect';
import { Method, RawHeader, Status } from '@fp4ts/http-core';
import { ResponseHeaders } from '@fp4ts/http-dsl-client';
import { Client } from '@fp4ts/http-client';
import { NodeClient } from '@fp4ts/http-node-client';
import { withServerClient } from '@fp4ts/http-test-kit-node';
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
    it('should get root', async () => {
      await withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return getRoot
          .run(client.withBaseUri(baseUri))
          .flatMap(person => IO(() => expect(person).toEqual(carol)));
      }).unsafeRunToPromise();
    });

    it('should get simple endpoint', async () => {
      await withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return getGet
          .run(client.withBaseUri(baseUri))
          .flatMap(person => IO(() => expect(person).toEqual(alice)));
      }).unsafeRunToPromise();
    });

    it('should get simple endpoint', async () => {
      await withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return getGet
          .run(client.withBaseUri(baseUri))
          .flatMap(person => IO(() => expect(person).toEqual(alice)));
      }).unsafeRunToPromise();
    });
  });

  describe('Delete', () => {
    it('should perform delete with empty content', async () => {
      await withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return deleteEmpty
          .run(client.withBaseUri(baseUri))
          .flatMap(res => IO(() => expect(res).toBeUndefined()));
      }).unsafeRunToPromise();
    });
  });

  describe('Capture', () => {
    it('should capture the parameter', async () => {
      await withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return getCapture('Paula')
          .run(client.withBaseUri(baseUri))
          .flatMap(res =>
            IO(() => expect(res).toEqual(Person({ name: 'Paula', age: 0 }))),
          );
      }).unsafeRunToPromise();
    });
  });

  describe('Capture All', () => {
    it('should capture no parameters', async () => {
      await withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return getCaptureAll(List.empty)
          .run(client.withBaseUri(baseUri))
          .flatMap(res => IO(() => expect(res).toEqual([])));
      }).unsafeRunToPromise();
    });

    it('should capture a single parameter', async () => {
      await withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return getCaptureAll(List('Paula'))
          .run(client.withBaseUri(baseUri))
          .flatMap(res =>
            IO(() => expect(res).toEqual([Person({ name: 'Paula', age: 0 })])),
          );
      }).unsafeRunToPromise();
    });

    it('should capture a multiple parameters', async () => {
      await withServerClient(
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
      }).unsafeRunToPromise();
    });
  });

  describe('Request Body', () => {
    it('should pass request body', async () => {
      await withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;
        const clara = Person({ name: 'Clara', age: 34 });

        return postBody(clara)
          .run(client.withBaseUri(baseUri))
          .flatMap(res => IO(() => expect(res).toEqual(clara)));
      }).unsafeRunToPromise();
    });
  });

  describe('Query Parameter', () => {
    it('should pass query parameter', async () => {
      await withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return getParam(Some('alice'))
          .run(client.withBaseUri(baseUri))
          .flatMap(res => IO(() => expect(res).toEqual(alice)));
      }).unsafeRunToPromise();
    });

    it('should throw an error on wrong value', async () => {
      await withServerClient(
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
      }).unsafeRunToPromise();
    });

    it('should throw an error on empty value', async () => {
      await withServerClient(
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
      }).unsafeRunToPromise();
    });
  });

  describe('Raw', () => {
    it('should respond with success', async () => {
      await withServerClient(
        server,
        clientResource,
      )((server, client) => {
        const baseUri = server.baseUri;

        return rawSuccess(Method.GET)
          .run(client.withBaseUri(baseUri))
          .flatTap(res => IO(() => expect(res.status === Status.Ok).toBe(true)))
          .flatMap(res => res.bodyText.compileConcurrent().string)
          .flatMap(txt => IO(() => expect(txt).toBe('raw success')));
      }).unsafeRunToPromise();
    });

    it('should respond with failure', async () => {
      await withServerClient(
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
      }).unsafeRunToPromise();
    });

    it('should attach headers', async () => {
      await withServerClient(
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
      }).unsafeRunToPromise();
    });
  });

  test('Combinations of Capture, Query and ReqBody', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webSegment().filter(s => s.length > 0),
        A.fp4tsOption(fc.integer()),
        A.fp4tsOption(fc.boolean()),
        fc.tuple(fc.string(), fc.array(fc.integer())),
        async (str, num, flag, body) => {
          await withServerClient(
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
                    num.getOrElse(() => null),
                    flag.getOrElse(() => false),
                    body,
                  ]),
                ),
              );
          }).unsafeRunToPromise();
        },
      ),
    );
  });

  it('should attach receive attached headers', async () => {
    await withServerClient(
      server,
      clientResource,
    )((server, client) => {
      const baseUri = server.baseUri;

      return getHeaders
        .run(client.withBaseUri(baseUri))
        .flatMap(res =>
          IO(() => expect(res).toEqual(new ResponseHeaders([42, 'eg2'], true))),
        );
    }).unsafeRunToPromise();
  });
});
