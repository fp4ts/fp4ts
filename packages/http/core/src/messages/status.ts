// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EntityEncoder } from '../codec';
import { Response } from './response';

export class Status {
  public static readonly Ok = new Status(200, 'OK');
  public static readonly Created = new Status(201, 'Created');
  public static readonly NoContent = new Status(204, 'No Content');

  public static readonly BadRequest = new Status(400, 'Bad Request');
  public static readonly NotFound = new Status(404, 'Not Found');

  // eslint-disable-next-line prettier/prettier
  public static readonly InternalServerError = new Status(404, 'Internal Server Error');

  private readonly __void!: void;
  private constructor(
    public readonly code: number,
    public readonly name: string,
  ) {
    const apply = statusResponse(this);
    Object.setPrototypeOf(apply, this.constructor.prototype);
    for (const prop of Object.getOwnPropertyNames(this))
      Object.defineProperty(
        apply,
        prop,
        Object.getOwnPropertyDescriptor(this, prop)!,
      );
    return apply as this;
  }
}

export interface Status {
  <F>(): Response<F>;
  <A>(a: A): <F>(e: EntityEncoder<F, A>) => Response<F>;
}

function statusResponse(s: Status) {
  function buildResponse<F>(): Response<F>;
  function buildResponse<A>(
    a: A,
  ): <F>(encoder: EntityEncoder<F, A>) => Response<F>;
  function buildResponse(...xs: any[]): any {
    if (xs.length === 0) return new Response(s);
    else
      return (encoder: EntityEncoder<any, unknown>) =>
        new Response(s).withEntity(xs[0], encoder);
  }

  return buildResponse;
}
