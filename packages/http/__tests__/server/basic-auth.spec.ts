// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import { None, Option, OptionT, Some } from '@fp4ts/cats';
import { IO, IOF } from '@fp4ts/effect';
import {
  AuthedRoutes,
  Authorization,
  AuthScheme,
  BasicCredentials,
  EntityEncoder,
  HttpRoutes,
  Method,
  Request,
  Status,
  Token,
  uri,
} from '@fp4ts/http-core';
import { BasicAuth } from '@fp4ts/http-server';

describe('Basic Auth', () => {
  const realm = 'Test realm';
  const username = 'Test username';
  const password = 'Test password';

  const validatePassword = (creds: BasicCredentials): IO<Option<string>> =>
    IO.pure(
      creds.username === username && creds.password === password
        ? Some(username)
        : None,
    );

  const nukeService = (launchNukes: () => void) =>
    AuthedRoutes<IOF, string>(req => {
      const path = req.request.uri.path;
      if (path[0] === '' && path[1] === 'launch-the-nukes') {
        return OptionT.liftF(IO.Applicative)(
          IO(launchNukes).map(() => Status.Gone<IOF>()),
        );
      } else {
        return OptionT.none(IO.Applicative);
      }
    });

  const service = AuthedRoutes<IOF, string>(req => {
    const path = req.request.uri.path;
    if (path.components[0] === '') {
      return OptionT.liftF(IO.Applicative)(
        IO.pure(Status.Ok(req.context)(EntityEncoder.text<IOF>())),
      );
    } else {
      return OptionT.none(IO.Applicative);
    }
  });

  const basicMiddleware = BasicAuth(IO.Sync)(realm, validatePassword);

  it.M('should return Unauthorized when fails to authenticate', () => {
    const req = new Request<IOF>(Method.GET, uri`/launch-the-nukes`);
    let isNuked = false;
    const authenticatedService = HttpRoutes.orNotFound(IO.Monad)(
      basicMiddleware(nukeService(() => (isNuked = true))),
    );

    return authenticatedService
      .run(req)
      .tap(() => expect(isNuked).toBe(false))
      .map(res =>
        expect(res.status.code === Status.Unauthorized.code).toBe(true),
      );
  });

  it.M('should return Unauthorized when wrong user passed in', () => {
    const req = new Request<IOF>(Method.GET, uri`/`).putHeaders(
      Authorization(
        new Token(
          AuthScheme.Basic,
          new BasicCredentials('wrong user', password).token,
        ),
      ),
    );
    const authenticatedService = HttpRoutes.orNotFound(IO.Monad)(
      basicMiddleware(service),
    );

    return authenticatedService
      .run(req)
      .map(res => expect(res.status.code).toBe(Status.Unauthorized.code));
  });

  it.M('should return ok when authentication succeeds', () => {
    const req = new Request<IOF>(Method.GET, uri`/`).putHeaders(
      Authorization(
        new Token(
          AuthScheme.Basic,
          new BasicCredentials(username, password).token,
        ),
      ),
    );
    const authenticatedService = HttpRoutes.orNotFound(IO.Monad)(
      basicMiddleware(service),
    );

    return authenticatedService
      .run(req)
      .tap(res => expect(res.status.code).toBe(Status.Ok.code))
      .flatMap(res => res.bodyText.compileConcurrent().string)
      .map(body => expect(body).toBe(username));
  });
});
