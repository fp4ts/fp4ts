// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Resource } from '@fp4ts/effect';
import { Stream } from '@fp4ts/stream';
import {
  Accept,
  ContentType,
  EntityBody,
  EntityDecoder,
  EntityEncoder,
  MediaRange,
  MediaType,
  RawHeader,
  Request,
  Response,
  ToRaw,
} from '@fp4ts/http-core';
import { Client } from './client';

export class RequestBuilder<F> {
  public constructor(
    private readonly client: Client<F>,
    private readonly request: Request<F>,
  ) {}

  // -- Executors

  public run(): Resource<F, Response<F>> {
    return this.client.run(this.request);
  }

  public fetch<A>(f: (res: Response<F>) => Kind<F, [A]>): Kind<F, [A]> {
    return this.client.fetch(this.request, f);
  }

  public fetchAs<A>(d: EntityDecoder<F, A>): Kind<F, [A]> {
    return this.client.fetchAs(this.request, d);
  }

  public stream(): Stream<F, Response<F>> {
    return this.client.stream(this.request);
  }

  public streaming<A>(f: (res: Response<F>) => Stream<F, A>): Stream<F, A> {
    return this.client.streaming(this.request, f);
  }

  // -- Builder Ops

  /**
   * String overload is unsafe!
   */
  public accept(mr: string): RequestBuilder<F>;
  public accept(mr: MediaRange): RequestBuilder<F>;
  public accept(ah: Accept): RequestBuilder<F>;
  public accept(x: any): RequestBuilder<F> {
    const h =
      typeof x === 'string'
        ? Accept(MediaRange.fromString(x).get)
        : x instanceof MediaRange
        ? Accept(x)
        : x;
    return this.withRequest(this.request.putHeaders(h));
  }

  /**
   * String overload is unsafe!
   */
  public contentType(mt: string): RequestBuilder<F>;
  public contentType(mt: MediaType): RequestBuilder<F>;
  public contentType(ct: ContentType): RequestBuilder<F>;
  public contentType(x: any): RequestBuilder<F> {
    const h =
      typeof x === 'string'
        ? ContentType(MediaType.fromString(x).get)
        : x instanceof MediaType
        ? ContentType(x)
        : x;
    return this.withRequest(this.request.putHeaders(h));
  }

  public set(headerName: string, value: string): RequestBuilder<F>;
  public set(...hs: ToRaw[]): RequestBuilder<F>;
  public set(...hs: any[]): RequestBuilder<F> {
    if (hs.length === 2 && typeof hs[0] === 'string') {
      return this.withRequest(
        this.request.putHeaders(new RawHeader(hs[0], hs[1])),
      );
    } else {
      return this.withRequest(this.request.putHeaders(...hs));
    }
  }

  public send(body: EntityBody<F>): RequestBuilder<F>;
  public send<A>(entity: A, encoder: EntityEncoder<F, A>): RequestBuilder<F>;
  public send(x: any, y?: any): RequestBuilder<F> {
    return y == null
      ? this.withRequest(this.request.withBodyStream(x))
      : this.withRequest(this.request.withEntity(x, y));
  }

  // -- Private

  private withRequest(req: Request<F>): RequestBuilder<F> {
    return new RequestBuilder(this.client, req);
  }
}
