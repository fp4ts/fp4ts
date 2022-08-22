// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import { $ } from '@fp4ts/core';
import { FunctionK, List, Some } from '@fp4ts/cats';
import { IO, IOF } from '@fp4ts/effect';
import { Request } from '@fp4ts/http-core';
import { JSON } from '@fp4ts/http-dsl';
import {
  builtins,
  FreeClient,
  FreeClientF,
  ResponseHeaders,
  toClientIn,
} from '@fp4ts/http-dsl-client';
import { NodeClient } from '@fp4ts/http-node-client';
import { withServer } from '@fp4ts/http-test-kit-node';
import {
  alice,
  api,
  carol,
  multiTupleCodable,
  multiTupleTupleTag,
  Person,
  PersonArrayCodable,
  PersonArrayTypeTag,
  PersonCodable,
  PersonTypeTag,
  server,
  stringNumberArrayCodable,
  stringNumberArrayTupleTag,
} from './common';

describe('FreeClient', () => {
  const fApi = toClientIn(FreeClient.RunClient<IOF>())(api, {
    ...builtins,
    [JSON.mime]: {
      [PersonTypeTag]: PersonCodable,
      [PersonArrayTypeTag]: PersonArrayCodable,
      [stringNumberArrayTupleTag]: stringNumberArrayCodable,
      [multiTupleTupleTag]: multiTupleCodable,
    },
  });

  const [
    getRoot,
    getGet,
    deleteEmpty,
    getCapture,
    getCaptureAll,
    postBody,
    getParam,
    ,
    ,
    ,
    ,
    getHeaders,
  ] = fApi;

  const client = NodeClient.makeClient(IO.Async);

  const interpret: FunctionK<$<FreeClientF, [IOF]>, IOF> = f =>
    f.fold(
      e => IO.throwError(new Error(e.toString())),
      bt => bt.compileConcurrent().string as any,
      (req, respond) => client.fetch(req, res => IO.pure(respond(res))),
    );

  it.M('should get root', () =>
    withServer(server)(server =>
      getRoot(new Request({ uri: server.baseUri }))
        .foldMap(IO.Monad)(interpret)
        .map(person => expect(person).toEqual(carol)),
    ),
  );

  it.M('should get simple endpoint', () =>
    withServer(server)(server =>
      getGet(new Request({ uri: server.baseUri }))
        .foldMap(IO.Monad)(interpret)
        .map(person => expect(person).toEqual(alice)),
    ),
  );

  it.M('should perform delete with empty content', () =>
    withServer(server)(server =>
      deleteEmpty(new Request({ uri: server.baseUri }))
        .foldMap(IO.Monad)(interpret)
        .map(res => expect(res).toBeUndefined()),
    ),
  );

  it.M('should capture the parameter', () =>
    withServer(server)(server =>
      getCapture('Paula')(new Request({ uri: server.baseUri }))
        .foldMap(IO.Monad)(interpret)
        .map(res => expect(res).toEqual(Person({ name: 'Paula', age: 0 }))),
    ),
  );

  it.M('should capture no parameters', () =>
    withServer(server)(server =>
      getCaptureAll(List.empty)(new Request({ uri: server.baseUri }))
        .foldMap(IO.Monad)(interpret)
        .map(res => expect(res).toEqual([])),
    ),
  );

  it.M('should capture a single parameter', () =>
    withServer(server)(server =>
      getCaptureAll(List('Paula'))(new Request({ uri: server.baseUri }))
        .foldMap(IO.Monad)(interpret)
        .map(res => expect(res).toEqual([Person({ name: 'Paula', age: 0 })])),
    ),
  );

  it.M('should capture a multiple parameters', () =>
    withServer(server)(server =>
      getCaptureAll(List('Paula', 'Kim', 'Jessica'))(
        new Request({ uri: server.baseUri }),
      )
        .foldMap(IO.Monad)(interpret)
        .map(res =>
          expect(res).toEqual([
            Person({ name: 'Paula', age: 0 }),
            Person({ name: 'Kim', age: 1 }),
            Person({ name: 'Jessica', age: 2 }),
          ]),
        ),
    ),
  );

  it.M('should pass request body', () =>
    withServer(server)(server => {
      const uri = server.baseUri;
      const clara = Person({ name: 'Clara', age: 34 });

      return postBody(clara)(new Request({ uri }))
        .foldMap(IO.Monad)(interpret)
        .map(res => expect(res).toEqual(clara));
    }),
  );

  it.M('should pass query parameter', () =>
    withServer(server)(server =>
      getParam(Some('alice'))(new Request({ uri: server.baseUri }))
        .foldMap(IO.Monad)(interpret)
        .map(res => expect(res).toEqual(alice)),
    ),
  );

  it.M('should attach receive attached headers', () =>
    withServer(server)(server =>
      getHeaders(new Request({ uri: server.baseUri }))
        .foldMap(IO.Monad)(interpret)
        .map(res =>
          expect(res).toEqual(new ResponseHeaders([42, 'eg2'], true)),
        ),
    ),
  );
});
