// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ContentType, Request, Response } from '@fp4ts/http-core';
import { DecodeFailure } from '@fp4ts/schema';

export type ClientError<F> =
  | ResponseFailure<F>
  | ContentTypeFailure<F>
  | ClientDecodeFailure<F>
  | ConnectionFailure;

export class ResponseFailure<F> {
  public tag = 'response-failure';
  public constructor(
    public readonly request: Request<F>,
    public readonly response: Response<F>,
  ) {}
}

export class ContentTypeFailure<F> {
  public tag = 'content-type-failure';
  public constructor(
    public readonly contentType: ContentType,
    public readonly response: Response<F>,
  ) {}
}

export class ClientDecodeFailure<F> {
  public tag = 'client-decode-failure';
  public constructor(
    public readonly failure: DecodeFailure,
    public readonly response: Response<F>,
  ) {}
}

export class ConnectionFailure {
  public tag = 'connection-failure';
  public constructor(public readonly failure: Error) {}
}
