// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe } from '@fp4ts/core';
import { FunctionK, Monad } from '@fp4ts/cats';

import { EntityDecoder } from '../codec';
import { Entity } from '../entity';
import { Headers } from '../headers_';
import { HttpVersion } from '../http-version';
import { Message } from './message';
import { Response } from './response';
import { Method } from './method';
import { Uri } from './uri';
import { Attributes } from './attributes';
import { EntityBody } from '../entity-body';
import { ParsingFailure } from './message-failure';

export class Request<F> extends Message<F, Request<F>> {
  public readonly method: Method = Method.GET;
  public readonly uri: Uri = Uri.Root;
  public readonly httpVersion: HttpVersion = '1.1';
  public readonly headers: Headers = Headers.empty;
  public readonly body: EntityBody<F> = EntityBody.empty();
  public readonly attributes: Attributes = Attributes.empty;

  public constructor({
    method = Method.GET,
    uri = Uri.Root,
    httpVersion = '1.1',
    headers = Headers.empty,
    body = EntityBody.empty(),
    attributes = Attributes.empty,
  }: Partial<Props<F>> = {}) {
    super();
    this.method = method;
    this.uri = uri;
    this.httpVersion = httpVersion;
    this.headers = headers;
    this.body = body;
    this.attributes = attributes;
  }

  protected copy({
    method = this.method,
    uri = this.uri,
    httpVersion = this.httpVersion,
    headers = this.headers,
    body = this.body,
    attributes = this.attributes,
  }: Partial<Props<F>> = {}): Request<F> {
    return new Request({ method, uri, httpVersion, headers, body, attributes });
  }

  public mapK<G>(nt: FunctionK<F, G>): Request<G> {
    return new Request({
      method: this.method,
      uri: this.uri,
      httpVersion: this.httpVersion,
      headers: this.headers,
      body: this.body.mapK(nt),
    });
  }

  public withMethod(method: Method): Request<F> {
    return this.copy({ method });
  }

  public withUri(uri: Uri): Request<F> {
    return this.copy({ uri });
  }

  public transformUri(f: (uri: Uri) => Uri): Request<F> {
    return this.copy({ uri: f(this.uri) });
  }

  public decode<A>(
    F: Monad<F>,
    decoder: EntityDecoder<F, A>,
  ): (f: (a: A) => Response<F>) => Kind<F, [Response<F>]> {
    return f =>
      pipe(
        decoder.decode(this),
        F.map(ea =>
          ea.fold<Response<F>>(
            e =>
              new ParsingFailure(e.cause.getOrElse(() => '')).toHttpResponse(),
            f,
          ),
        ),
      );
  }

  public decodeWith<A>(
    F: Monad<F>,
    decoder: EntityDecoder<F, A>,
  ): (f: (a: A) => Kind<F, [Response<F>]>) => Kind<F, [Response<F>]> {
    return f =>
      pipe(
        decoder.decode(this),
        F.flatMap(ea =>
          ea.fold<Kind<F, [Response<F>]>>(
            e =>
              F.pure(
                new ParsingFailure(
                  e.cause.getOrElse(() => ''),
                ).toHttpResponse(),
              ),
            f,
          ),
        ),
      );
  }
}
type Props<F> = {
  readonly method: Method;
  readonly uri: Uri;
  readonly httpVersion: HttpVersion;
  readonly headers: Headers;
  readonly entity: Entity<F>;
  readonly attributes: Attributes;
  readonly body: EntityBody<F>;
};
