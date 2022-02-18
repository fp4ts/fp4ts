// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kleisli } from '@fp4ts/cats';
import { IO, IOF, IOOutcome } from '@fp4ts/effect';
import {
  EntityDecoder,
  EntityEncoder,
  HttpApp,
  Method,
  Request,
  Status,
  uri,
} from '@fp4ts/http-core';
import { Client } from '@fp4ts/http-client';

describe('Mock Client', () => {
  const app: HttpApp<IOF> = Kleisli(req =>
    IO.pure(Status.Ok<IOF>().withBodyStream(req.body)),
  );

  const client: Client<IOF> = Client.fromHttpApp(IO.Async)(app);
  it('should read body before being disposed', async () => {
    await client
      .post(uri`/`)
      .send('foo', EntityEncoder.text())
      .fetchAs(EntityDecoder.text(IO.Concurrent))
      .flatMap(text => IO(() => expect(text).toBe('foo')))
      .unsafeRunToPromise();
  });

  it('should fail to read body after dispose', async () => {
    await IO.pure(
      new Request<IOF>(Method.POST).withEntity('foo', EntityEncoder.text()),
    )
      .flatMap(req =>
        client
          .run(req)
          // This is bad -- resource (Response) scope escaping
          .use(IO.Async)(IO.pure)
          .flatMap(res => res.bodyText.compileConcurrent().string),
      )
      .attempt.map(ea => ea.getLeft.message)
      .flatMap(msg => IO(() => expect(msg).toBe('response was destroyed')))
      .unsafeRunToPromise();
  });

  it('should allow request to be canceled', async () => {
    await IO.deferred<void>()
      .flatMap(cancelSignal => {
        const app: HttpApp<IOF> = Kleisli(() =>
          cancelSignal.complete()['>>>'](IO.never),
        );
        const cancelClient = Client.fromHttpApp(IO.Async)(app);

        return IO.deferred<IOOutcome<string>>()
          .flatTap(outcome =>
            cancelClient
              .get(uri`https://fp4ts.org`)
              .fetchAs(EntityDecoder.text(IO.Concurrent))
              .finalize(oc => outcome.complete(oc).void)
              .fork.flatTap(fiber => cancelSignal.get()['>>>'](fiber.cancel)),
          )
          .flatMap(oc => oc.get());
      })
      .flatMap(oc => IO(() => expect(oc).toEqual(IOOutcome.canceled())))
      .unsafeRunToPromise();
  });
});
