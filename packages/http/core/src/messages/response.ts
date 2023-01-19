// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { FunctionK } from '@fp4ts/cats';
import { Attributes } from './attributes';
import { EntityBody } from '../entity-body';
import { Headers } from '../headers_';
import { HttpVersion } from '../http-version';
import { Message } from './message';
import { Status } from './status';

export class Response<F> extends Message<F, Response<F>> {
  public constructor(
    public readonly status: Status = Status.Ok,
    public readonly httpVersion: HttpVersion = '1.1',
    public readonly headers: Headers = Headers.empty,
    public readonly body: EntityBody<F> = EntityBody.empty(),
    public readonly attributes: Attributes = Attributes.empty,
  ) {
    super();
  }

  protected copy({
    status = this.status,
    httpVersion = this.httpVersion,
    headers = this.headers,
    body = this.body,
    attributes = this.attributes,
  }: Partial<Props<F>> = {}): Response<F> {
    return new Response(status, httpVersion, headers, body, attributes);
  }

  public mapK<G>(nt: FunctionK<F, G>): Response<G> {
    return new Response(
      this.status,
      this.httpVersion,
      this.headers,
      this.body.mapK(nt),
    );
  }

  public withStatus(status: Status): Response<F> {
    return this.copy({ status });
  }
}
type Props<F> = {
  readonly status: Status;
  readonly httpVersion: HttpVersion;
  readonly headers: Headers;
  readonly body: EntityBody<F>;
  readonly attributes: Attributes;
};
