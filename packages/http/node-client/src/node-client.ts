// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import http from 'http';
import { Either, Left } from '@fp4ts/cats';
import { Async, Dispatcher, Resource } from '@fp4ts/effect';
import { Stream } from '@fp4ts/stream';
import * as io from '@fp4ts/stream-io';
import { Request, Response, Status } from '@fp4ts/http-core';
import { Client, DefaultClient } from '@fp4ts/http-client';
import {
  headersToOutgoingHeaders,
  incomingHeadersToHeaders,
} from '@fp4ts/http-node-shared';

export class NodeClient<F> extends DefaultClient<F> {
  public static makeClient<F>(F: Async<F>): Client<F> {
    return new NodeClient(F);
  }

  private constructor(F: Async<F>) {
    super(F, req => this.run0(req));
  }

  private run0(req: Request<F>): Resource<F, Response<F>> {
    const F = this.F;
    const RA = Resource.Async(this.F);

    return RA.do(function* (_) {
      const dispatcher = yield* _(Dispatcher(F));
      const errSignal = yield* _(Resource.evalF(F.deferred<Error>()));
      const respSignal = yield* _(Resource.evalF(F.deferred<Response<F>>()));

      const req_ = F.delay(() => {
        const r = http.request(requestToRequestOptions(req), res_ =>
          dispatcher.unsafeRunAndForget(
            F.defer(() => {
              const status = Status.unsafeFromCode(res_.statusCode!);
              const headers = incomingHeadersToHeaders(res_.headers);
              const body = io.readReadable(F)(F.pure(res_));
              const res = new Response(status, '1.1', headers, body);
              return respSignal.complete(res);
            }),
          ),
        );

        r.on('error', e =>
          dispatcher.unsafeRunAndForget(errSignal.complete(e)),
        );

        return r;
      });

      const resp = io
        .writeWritable(F)(req_)(req.body)
        // interrupt on connection error
        .interruptWhen(F.map_(errSignal.get(), Left))
        // interrupt as soon as server responds -- possibility of not consuming the body
        .interruptWhen(F.map_(respSignal.get(), () => Either.rightUnit))
        ['+++'](Stream.evalF(respSignal.get()))
        .compileConcurrent(F).last;
      return yield* _(Resource.evalF(resp));
    });
  }
}

function requestToRequestOptions<F>(req: Request<F>): http.RequestOptions {
  return {
    method: req.method.methodName.toUpperCase(),
    port: req.uri.authority.flatMap(a => a.port).getOrElse(() => undefined),
    hostname: req.uri.authority.map(a => a.host).getOrElse(() => 'localhost'),
    path: `${req.uri.path.components.join('/')}${req.uri.query}`,
    headers: headersToOutgoingHeaders(req.headers),
    protocol: `${req.uri.scheme.getOrElse(() => 'http')}:`,
    defaultPort: 80,
  };
}
