// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import { stringType } from '@fp4ts/core';
import { IO, IOF } from '@fp4ts/effect';
import { Request, Method, EntityEncoder, uri } from '@fp4ts/http-core';
import {
  Get,
  GetNoContent,
  group,
  PlainText,
  Post,
  ReqBody,
  Route,
} from '@fp4ts/http-dsl';
import { builtins, toHttpApp } from '@fp4ts/http-dsl-server';

describe('dsl routing', () => {
  const api = group(
    Route('version')[':>'](GetNoContent),
    Route('ping')[':>'](Get(PlainText, stringType)),
    Route('echo')
      [':>'](ReqBody(PlainText, stringType))
      [':>'](Post(PlainText, stringType)),
  );

  const app = toHttpApp(IO.Concurrent)(api, builtins)(S => [
    S.unit,
    S.return('pong'),
    x => S.return(x),
  ]);

  it.M('should return 204', () =>
    app(new Request({ uri: uri`/version` })).map(response =>
      expect(response.status.code).toBe(204),
    ),
  );

  it.M('should return pong', () =>
    app(new Request({ uri: uri`/ping` }))
      .flatMap(response => response.bodyText.compileConcurrent().string)
      .map(response => expect(response).toBe('pong')),
  );

  it.M('should echo the body request', () =>
    app(
      new Request<IOF>({ method: Method.POST, uri: uri`/echo` }).withEntity(
        'sample payload',
        EntityEncoder.text(),
      ),
    )
      .flatMap(response => response.bodyText.compileConcurrent().string)
      .map(response => expect(response).toBe('sample payload')),
  );

  it.M('should return 404 when route is not found', () =>
    app(new Request({ uri: uri`/some/random/uri` })).map(response =>
      expect(response.status.code).toBe(404),
    ),
  );
});
