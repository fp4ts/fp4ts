// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import { None, Option, OptionT, Some } from '@fp4ts/cats';
import { IO, IOF } from '@fp4ts/effect';
import { match } from '@fp4ts/optics';
import {
  AuthedRoutes,
  Authorization,
  AuthScheme,
  BasicCredentials,
  Challenge,
  EntityEncoder,
  HttpRoutes,
  Method,
  Request,
  Status,
  Token,
  uri,
  WWWAuthenticate,
  Get_,
  path,
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
    AuthedRoutes<IOF, string>(req =>
      match(req.request)
        .case(Get_(path`/launch-the-nukes`), () =>
          OptionT.liftF(IO.Applicative)(
            IO(launchNukes).map(() => Status.Gone<IOF>()),
          ),
        )
        .getOrElse(() => OptionT.None(IO.Applicative)),
    );

  const service = AuthedRoutes<IOF, string>(req =>
    match(req.request)
      .case(Get_(path`/`), () =>
        OptionT.liftF(IO.Applicative)(
          IO.pure(Status.Ok(req.context)(EntityEncoder.text<IOF>())),
        ),
      )
      .getOrElse(() => OptionT.None(IO.Applicative)),
  );

  const basicMiddleware = BasicAuth(IO.Sync)(realm, validatePassword);

  it.M('should return Unauthorized when fails to authenticate', () => {
    const req = new Request<IOF>({ uri: uri`/launch-the-nukes` });
    let isNuked = false;
    const authenticatedService = HttpRoutes.orNotFound(IO.Monad)(
      basicMiddleware(nukeService(() => (isNuked = true))),
    );

    return authenticatedService(req)
      .tap(() => expect(isNuked).toBe(false))
      .map(res =>
        expect(res.status.code === Status.Unauthorized.code).toBe(true),
      );
  });

  it.M('should return Unauthorized no user passed', () => {
    const req = new Request<IOF>({ method: Method.GET, uri: uri`/` });
    const authenticatedService = HttpRoutes.orNotFound(IO.Monad)(
      basicMiddleware(service),
    );

    return authenticatedService(req)
      .tap(res =>
        expect(res.headers.get(WWWAuthenticate.Select)).toEqual(
          Some(new WWWAuthenticate(new Challenge('Basic', realm))),
        ),
      )
      .map(res => expect(res.status.code).toBe(Status.Unauthorized.code));
  });

  it.M('should return Unauthorized when wrong user passed in', () => {
    const req = new Request<IOF>({ uri: uri`/` }).putHeaders(
      new Authorization(
        new Token(
          AuthScheme.Basic,
          new BasicCredentials('wrong user', password).token,
        ),
      ),
    );
    const authenticatedService = HttpRoutes.orNotFound(IO.Monad)(
      basicMiddleware(service),
    );

    return authenticatedService(req)
      .tap(res =>
        expect(res.headers.get(WWWAuthenticate.Select)).toEqual(
          Some(new WWWAuthenticate(new Challenge('Basic', realm))),
        ),
      )
      .map(res => expect(res.status.code).toBe(Status.Unauthorized.code));
  });

  it.M('should return ok when authentication succeeds', () => {
    const req = new Request<IOF>({ uri: uri`/` }).putHeaders(
      new Authorization(
        new Token(
          AuthScheme.Basic,
          new BasicCredentials(username, password).token,
        ),
      ),
    );
    const authenticatedService = HttpRoutes.orNotFound(IO.Monad)(
      basicMiddleware(service),
    );

    return authenticatedService(req)
      .tap(res => expect(res.status.code).toBe(Status.Ok.code))
      .flatMap(res => res.bodyText.compileConcurrent().string)
      .map(body => expect(body).toBe(username));
  });
});
