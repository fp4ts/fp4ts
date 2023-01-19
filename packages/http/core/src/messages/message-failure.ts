// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { None, Option, Some } from '@fp4ts/cats';
import { EntityEncoder } from '../codec';
import { HttpVersion } from '../http-version';
import { Accept, ContentType, WWWAuthenticate } from '../headers_';
import { MediaType } from '../media-type';
import { Challenge } from '../challenge';
import { Response } from './response';
import { Status } from './status';
import { Method } from './method';

export abstract class MessageFailure extends Error {
  public abstract readonly cause: Option<Error>;

  public abstract toHttpResponse<F>(httpVersion: HttpVersion): Response<F>;
}

export class ParsingFailure extends MessageFailure {
  public constructor(
    public readonly sanitized: string = '',
    public readonly details: string = '',
  ) {
    super(
      details === ''
        ? sanitized
        : sanitized === ''
        ? details
        : `${sanitized}: ${details}`,
    );
  }

  public readonly cause = None;

  public toHttpResponse<F>(httpVersion: HttpVersion = '1.1'): Response<F> {
    return new Response<F>(Status.BadRequest, httpVersion).withEntity(
      this.sanitized,
      EntityEncoder.text(),
    );
  }
}

export class NotAcceptFailure extends MessageFailure {
  public constructor(
    public readonly supplied: ContentType,
    public readonly expected: Accept,
  ) {
    super(`Expected ${expected.values.head}, supplied: ${supplied.mediaType}`);
  }

  public readonly cause = None;

  public toHttpResponse<F>(httpVersion: HttpVersion): Response<F> {
    return new Response<F>(Status.NotAcceptable, httpVersion).withEntity(
      this.message,
      EntityEncoder.text(),
    );
  }
}

export class UnsupportedMediaTypeFailure extends MessageFailure {
  public constructor(public readonly mt: MediaType) {
    super(`${mt.mainType}/${mt.subType}`);
  }

  public readonly cause = None;

  public toHttpResponse<F>(httpVersion: HttpVersion): Response<F> {
    return new Response<F>(Status.UnsupportedMediaType, httpVersion).withEntity(
      `${this.mt.mainType}/${this.mt.subType} Not supported`,
      EntityEncoder.text<F>(),
    );
  }
}

export class MethodNotAllowedFailure extends MessageFailure {
  public constructor(public readonly method: Method) {
    super(`${method.methodName}`);
  }

  public readonly cause = None;

  public toHttpResponse<F>(httpVersion: HttpVersion): Response<F> {
    return new Response<F>(Status.MethodNotAllowed, httpVersion).withEntity(
      `${this.method.methodName} Not Allowed`,
      EntityEncoder.text<F>(),
    );
  }
}

export class NotFoundFailure extends MessageFailure {
  public constructor(public readonly sanitized: string = '') {
    super(sanitized);
  }

  public readonly cause = None;

  public toHttpResponse<F>(httpVersion: HttpVersion): Response<F> {
    return new Response<F>(Status.NotFound, httpVersion).withEntity(
      this.sanitized,
      EntityEncoder.text<F>(),
    );
  }
}

export class UnauthorizedFailure extends MessageFailure {
  public constructor(public readonly sanitized: string = '') {
    super(sanitized);
  }

  public readonly cause = None;

  public toHttpResponse<F>(httpVersion: HttpVersion): Response<F> {
    return new Response<F>(Status.Unauthorized, httpVersion).withEntity(
      this.sanitized,
      EntityEncoder.text<F>(),
    );
  }
}

export class BasicAuthFailure extends UnauthorizedFailure {
  public constructor(
    public readonly challenge: Challenge,
    sanitized: string = 'Unauthorized',
  ) {
    super(sanitized);
  }

  public override toHttpResponse<F>(httpVersion: HttpVersion): Response<F> {
    return new Response<F>(Status.Unauthorized, httpVersion)
      .withEntity(this.sanitized, EntityEncoder.text<F>())
      .putHeaders(new WWWAuthenticate(this.challenge));
  }
}

export class InternalServerErrorFailure extends MessageFailure {
  public constructor(public readonly error: Error) {
    super(error.message);
  }

  public cause: Option<Error> = Some(this.error);

  public toHttpResponse<F>(httpVersion: HttpVersion): Response<F> {
    return new Response<F>(Status.InternalServerError, httpVersion).withEntity(
      this.error.toString(),
      EntityEncoder.text(),
    );
  }
}
