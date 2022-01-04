// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, pipe } from '@fp4ts/core';
import { Kleisli, OptionT, OptionTK } from '@fp4ts/cats';
import { IO, IoK } from '@fp4ts/effect';
import {
  Request,
  Status,
  Method,
  HttpRoutes,
  EntityEncoder,
  Uri,
} from '@fp4ts/http-core';

describe('simple http', () => {
  const F = Kleisli.Alternative<$<OptionTK, [IoK]>, Request<IoK>>(
    OptionT.Alternative(IO.Monad),
  );

  const ping1: HttpRoutes<IoK> = Kleisli(req =>
    req.method === Method.GET && req.uri.path.startsWith('/ping1')
      ? OptionT.some(IO.Applicative)(Status.Ok('pong')(EntityEncoder.text()))
      : OptionT.none(IO.Applicative),
  );
  const ping2: HttpRoutes<IoK> = Kleisli(req =>
    req.method === Method.GET && req.uri.path.startsWith('/ping2')
      ? OptionT.some(IO.Applicative)(Status.Ok('pong')(EntityEncoder.text()))
      : OptionT.none(IO.Applicative),
  );

  const app = pipe(
    ping1,
    F.orElse(() => ping1),
    F.orElse(() => ping2),
    HttpRoutes.orNotFound(IO.Monad),
  );

  it('should return 404', async () => {
    const response = await app.run(new Request()).unsafeRunToPromise();
    expect(response.status.code).toBe(404);
  });

  it('should return 200', async () => {
    const response = await app
      .run(
        new Request(
          Method.GET,
          Uri.fromStringUnsafe('http://localhost:3000/ping1'),
        ),
      )
      .unsafeRunToPromise();

    expect(response.status.code).toBe(200);
  });
});
