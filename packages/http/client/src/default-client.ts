// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Kleisli } from '@fp4ts/cats';
import { Async, Resource } from '@fp4ts/effect';
import { Stream } from '@fp4ts/stream';
import {
  Accept,
  EntityDecoder,
  Method,
  Request,
  Response,
  uri,
  Uri,
} from '@fp4ts/http-core';
import { Client } from './client';
import { RequestBuilder } from './request-builder';

export class DefaultClient<F> implements Client<F> {
  public constructor(
    protected readonly F: Async<F>,
    public readonly run: (req: Request<F>) => Resource<F, Response<F>>,
    private readonly baseUri?: Uri,
  ) {}

  public fetch<A>(
    req: Request<F>,
    f: (res: Response<F>) => Kind<F, [A]>,
  ): Kind<F, [A]> {
    return this.baseUri
      ? this.run(
          req.withUri(
            // TODO: allow for base path as well
            req.uri.copy({
              scheme: this.baseUri.scheme,
              authority: this.baseUri.authority,
            }),
          ),
        ).use(this.F)(f)
      : this.run(req).use(this.F)(f);
  }

  public withBaseUri(uri: Uri): Client<F> {
    return new DefaultClient(this.F, this.run, uri);
  }

  public fetchAs<A>(req: Request<F>, d: EntityDecoder<F, A>): Kind<F, [A]> {
    const r =
      d.consumes.size !== 0 ? req.withHeaders(Accept([...d.consumes][0])) : req;

    return this.run(r).use(this.F)(response =>
      this.F.rethrow(d.decode(response).leftWiden<Error>().value),
    );
  }

  public toKleisli<A>(
    f: (res: Response<F>) => Kind<F, [A]>,
  ): Kleisli<F, Request<F>, A> {
    return Kleisli(req => this.run(req).use(this.F)(f));
  }

  public stream(req: Request<F>): Stream<F, Response<F>> {
    return Stream.resource(this.F)(this.run(req));
  }

  public streaming<A>(
    req: Request<F>,
    f: (res: Response<F>) => Stream<F, A>,
  ): Stream<F, A> {
    return this.stream(req).flatMap(f);
  }

  public get<A>(uri: Uri, f: (res: Response<F>) => Kind<F, [A]>): Kind<F, [A]>;
  public get<A>(
    uri: string,
    f: (res: Response<F>) => Kind<F, [A]>,
  ): Kind<F, [A]>;
  public get(uri: Uri): RequestBuilder<F>;
  public get(uri: string): RequestBuilder<F>;
  public get(uri: any, f?: any): any {
    return this.method(Method.GET, uri, f);
  }

  public post<A>(uri: Uri, f: (res: Response<F>) => Kind<F, [A]>): Kind<F, [A]>;
  public post<A>(
    uri: string,
    f: (res: Response<F>) => Kind<F, [A]>,
  ): Kind<F, [A]>;
  public post(uri: Uri): RequestBuilder<F>;
  public post(uri: string): RequestBuilder<F>;
  public post(uri: any, f?: any): any {
    return this.method(Method.POST, uri, f);
  }

  public put<A>(uri: Uri, f: (res: Response<F>) => Kind<F, [A]>): Kind<F, [A]>;
  public put<A>(
    uri: string,
    f: (res: Response<F>) => Kind<F, [A]>,
  ): Kind<F, [A]>;
  public put(uri: Uri): RequestBuilder<F>;
  public put(uri: string): RequestBuilder<F>;
  public put(uri: any, f?: any): any {
    return this.method(Method.PUT, uri, f);
  }

  public patch<A>(
    uri: Uri,
    f: (res: Response<F>) => Kind<F, [A]>,
  ): Kind<F, [A]>;
  public patch<A>(
    uri: string,
    f: (res: Response<F>) => Kind<F, [A]>,
  ): Kind<F, [A]>;
  public patch(uri: Uri): RequestBuilder<F>;
  public patch(uri: string): RequestBuilder<F>;
  public patch(uri: any, f?: any): any {
    return this.method(Method.PATCH, uri, f);
  }

  public delete<A>(
    uri: Uri,
    f: (res: Response<F>) => Kind<F, [A]>,
  ): Kind<F, [A]>;
  public delete<A>(
    uri: string,
    f: (res: Response<F>) => Kind<F, [A]>,
  ): Kind<F, [A]>;
  public delete(uri: Uri): RequestBuilder<F>;
  public delete(uri: string): RequestBuilder<F>;
  public delete(uri: any, f?: any): any {
    return this.method(Method.DELETE, uri, f);
  }

  private method<A>(
    method: Method,
    uri: Uri,
    f: (res: Response<F>) => Kind<F, [A]>,
  ): Kind<F, [A]>;
  private method<A>(
    method: Method,
    uri: string,
    f: (res: Response<F>) => Kind<F, [A]>,
  ): Kind<F, [A]>;
  private method(method: Method, uri: Uri): RequestBuilder<F>;
  private method(method: Method, uri: string): RequestBuilder<F>;
  private method(method: any, uri: any, f?: any): any {
    return typeof uri === 'string'
      ? this.method(method, Uri.unsafeFromString(uri), f)
      : f != null
      ? this.fetch(new Request(method, uri), f)
      : new RequestBuilder(this, new Request(method, uri));
  }
}
