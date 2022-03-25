// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { hole, Kind } from '@fp4ts/core';
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

export class Request<F> extends Message<F, Request<F>> {
  public constructor(
    public readonly method: Method = Method.GET,
    public readonly uri: Uri = Uri.Root,
    public readonly httpVersion: HttpVersion = '1.1',
    public readonly headers: Headers = Headers.empty,
    public readonly body: EntityBody<F> = EntityBody.empty(),
    public readonly attributes: Attributes = Attributes.empty,
  ) {
    super();
  }

  protected copy({
    method = this.method,
    uri = this.uri,
    httpVersion = this.httpVersion,
    headers = this.headers,
    body = this.body,
    attributes = this.attributes,
  }: Partial<Props<F>> = {}): Request<F> {
    return new Request(method, uri, httpVersion, headers, body, attributes);
  }

  public mapK<G>(nt: FunctionK<F, G>): Request<G> {
    return new Request(
      this.method,
      this.uri,
      this.httpVersion,
      this.headers,
      this.body.mapK(nt),
    );
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
    return f => decoder.decode(this).fold(F)<Response<F>>(hole, f);
  }

  public decodeWith<A>(
    F: Monad<F>,
    decoder: EntityDecoder<F, A>,
  ): (f: (a: A) => Kind<F, [Response<F>]>) => Kind<F, [Response<F>]> {
    return f =>
      F.flatten(decoder.decode(this).fold(F)<Kind<F, [Response<F>]>>(hole, f));
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
