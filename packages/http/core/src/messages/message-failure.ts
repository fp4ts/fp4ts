// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { None, Option } from '@fp4ts/cats';
import { EntityEncoder } from '../codec';
import { HttpVersion } from '../http-version';
import { Response } from './response';
import { Status } from './status';

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

  public toHttpResponse<F>(httpVersion: HttpVersion): Response<F> {
    return new Response<F>(Status.BadRequest, httpVersion).withEntity(
      this.sanitized,
      EntityEncoder.text<F>(),
    );
  }
}
