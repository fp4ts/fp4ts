// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Byte, Kind } from '@fp4ts/core';
import { Kleisli } from '@fp4ts/cats';
import { Resource, Async } from '@fp4ts/effect';
import { Pull, Stream } from '@fp4ts/stream';
import {
  EntityDecoder,
  HttpApp,
  Request,
  Response,
  Uri,
} from '@fp4ts/http-core';
import { DefaultClient } from './default-client';
import { RequestBuilder } from './request-builder';

export interface Client<F> {
  run(req: Request<F>): Resource<F, Response<F>>;

  fetch<A>(
    req: Request<F>,
    f: (res: Response<F>) => Kind<F, [A]>,
  ): Kind<F, [A]>;

  fetchAs<A>(req: Request<F>, d: EntityDecoder<F, A>): Kind<F, [A]>;

  toKleisli<A>(
    f: (res: Response<F>) => Kind<F, [A]>,
  ): Kleisli<F, Request<F>, A>;

  stream(req: Request<F>): Stream<F, Response<F>>;
  streaming<A>(
    req: Request<F>,
    f: (res: Response<F>) => Stream<F, A>,
  ): Stream<F, A>;

  /**
   * String overload unsafe!
   */
  get<A>(uri: Uri, f: (res: Response<F>) => Kind<F, [A]>): Kind<F, [A]>;
  get<A>(uri: string, f: (res: Response<F>) => Kind<F, [A]>): Kind<F, [A]>;
  get(uri: Uri): RequestBuilder<F>;
  get(uri: string): RequestBuilder<F>;

  /**
   * String overload unsafe!
   */
  post<A>(uri: Uri, f: (res: Response<F>) => Kind<F, [A]>): Kind<F, [A]>;
  post<A>(uri: string, f: (res: Response<F>) => Kind<F, [A]>): Kind<F, [A]>;
  post(uri: Uri): RequestBuilder<F>;
  post(uri: string): RequestBuilder<F>;

  /**
   * String overload unsafe!
   */
  put<A>(uri: Uri, f: (res: Response<F>) => Kind<F, [A]>): Kind<F, [A]>;
  put<A>(uri: string, f: (res: Response<F>) => Kind<F, [A]>): Kind<F, [A]>;
  put(uri: Uri): RequestBuilder<F>;
  put(uri: string): RequestBuilder<F>;

  /**
   * String overload unsafe!
   */
  patch<A>(uri: Uri, f: (res: Response<F>) => Kind<F, [A]>): Kind<F, [A]>;
  patch<A>(uri: string, f: (res: Response<F>) => Kind<F, [A]>): Kind<F, [A]>;
  patch(uri: Uri): RequestBuilder<F>;
  patch(uri: string): RequestBuilder<F>;

  /**
   * String overload unsafe!
   */
  delete<A>(uri: Uri, f: (res: Response<F>) => Kind<F, [A]>): Kind<F, [A]>;
  delete<A>(uri: string, f: (res: Response<F>) => Kind<F, [A]>): Kind<F, [A]>;
  delete(uri: Uri): RequestBuilder<F>;
  delete(uri: string): RequestBuilder<F>;
}

export const Client: ClientObj = function (F, run) {
  return new DefaultClient(F, run);
};

interface ClientObj {
  <F>(
    F: Async<F>,
    run: (req: Request<F>) => Resource<F, Response<F>>,
  ): Client<F>;

  fromHttpApp<F>(F: Async<F>): (app: HttpApp<F>) => Client<F>;
}

Client.fromHttpApp = function <F>(F: Async<F>) {
  return (app: HttpApp<F>) =>
    Client(
      F,
      (req: Request<F>): Resource<F, Response<F>> =>
        Resource.liftF(
          F.map_(F.ref(false), disposed => {
            const go = (pull: Pull<F, Byte, void>): Pull<F, Byte, void> =>
              pull.uncons.flatMap(opt =>
                opt.fold(
                  () => Pull.done(),
                  ([hd, tl]) =>
                    Pull.evalF(disposed.get()).flatMap(disposed =>
                      disposed
                        ? Pull.throwError(new Error('response was destroyed'))
                        : Pull.output(hd)['>>>'](() => go(tl)),
                    ),
                ),
              );

            const req0 = req.withBodyStream(go(req.body.pull).stream());

            return Resource.evalF(app.run(req0))
              .onFinalize(F)(() => disposed.set(true))
              .map(res => res.withBodyStream(go(res.body.pull).stream()));
          }),
        ),
    );
};
