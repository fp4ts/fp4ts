// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Left, Right } from '@fp4ts/cats';
import { List } from '@fp4ts/collections';
import { EntityEncoder } from '../codec';
import { Response } from './response';

const MinCode = 100;
const MaxCode = 599;

class Registry {
  private readonly registry: Either<Error, Status>[] = new Array(
    MaxCode + 1,
  ).fill(Left(new Error('Unregistered')));

  public lookup(code: number): Either<Error, Status> {
    return this.registry[code];
  }

  public register(status: Status): Status {
    this.registry[status.code] = Right(status);
    return status;
  }

  public get all(): List<Status> {
    return List.fromArray(this.registry).collect(x => x.toOption);
  }
}

export class Status {
  public static MinCode = MinCode;
  public static MaxCode = MaxCode;

  public static fromCode(code: number): Either<Error, Status> {
    if (code < MinCode || code > MaxCode)
      return Left(
        new Error(
          `Invalid code: ${code} is not between ${MinCode} and ${MaxCode}.`,
        ),
      );

    return this.registry
      .lookup(code)
      .fold(() => Right(this.registry.register(new Status(code, ''))), Right);
  }

  public static unsafeFromCode(code: number): Status {
    return this.fromCode(code).get;
  }

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

  public get isSuccessful(): boolean {
    return this.code >= 200 && this.code <= 299;
  }

  public toString(): string {
    return `[Status ${this.code} ${this.name}]`;
  }

  public valueOf(): number {
    return this.code;
  }

  private static registry = new Registry();

  public static get all(): List<Status> {
    return this.registry.all;
  }

  /* eslint-disable prettier/prettier */
  public static readonly Continue: Status = this.registry.register(new Status(100, 'Continue'));
  public static readonly SwitchingProtocols: Status = this.registry.register(new Status(101, 'Switching Protocols'));
  public static readonly Processing: Status = this.registry.register(new Status(102, 'Processing'));
  public static readonly EarlyHints: Status = this.registry.register(new Status(103, 'Early Hints'));

  public static readonly Ok: Status = this.registry.register(new Status(200, 'OK'));
  public static readonly Created: Status = this.registry.register(new Status(201, 'Created'));
  public static readonly Accepted: Status = this.registry.register(new Status(202, 'Accepted'));
  public static readonly NonAuthoritativeInformation: Status = this.registry.register(new Status(203, 'Non-Authoritative Information'));
  public static readonly NoContent: Status = this.registry.register(new Status(204, 'No Content'));
  public static readonly ResetContent: Status = this.registry.register(new Status(205, 'Reset Content'));
  public static readonly PartialContent: Status = this.registry.register(new Status(206, 'Partial Content'));
  public static readonly MultiStatus: Status = this.registry.register(new Status(207, 'Multi-Status'));
  public static readonly AlreadyReported: Status = this.registry.register(new Status(208, 'Already Reported'));
  public static readonly IMUsed: Status = this.registry.register(new Status(226, 'IM Used'));

  public static readonly MultipleChoices: Status = this.registry.register(new Status(300, 'Multiple Choices'));
  public static readonly MovedPermanently: Status = this.registry.register(new Status(301, 'Moved Permanently'));
  public static readonly Found: Status = this.registry.register(new Status(302, 'Found'));
  public static readonly SeeOther: Status = this.registry.register(new Status(303, 'See Other'));
  public static readonly NotModified: Status = this.registry.register(new Status(304, 'Not Modified'));
  public static readonly UseProxy: Status = this.registry.register(new Status(305, 'Use Proxy'));
  public static readonly TemporaryRedirect: Status = this.registry.register(new Status(307, 'Temporary Redirect'));
  public static readonly PermanentRedirect: Status = this.registry.register(new Status(308, 'Permanent Redirect'));

  public static readonly BadRequest: Status = this.registry.register(new Status(400, 'Bad Request'));
  public static readonly Unauthorized: Status = this.registry.register(new Status(401, 'Unauthorized'));
  public static readonly PaymentRequired: Status = this.registry.register(new Status(402, 'Payment Required'));
  public static readonly Forbidden: Status = this.registry.register(new Status(403, 'Forbidden'));
  public static readonly NotFound: Status = this.registry.register(new Status(404, 'Not Found'));
  public static readonly MethodNotAllowed: Status = this.registry.register(new Status(405, 'Method Not Allowed'));
  public static readonly NotAcceptable: Status = this.registry.register(new Status(406, 'Not Acceptable'));
  public static readonly ProxyAuthenticationRequired: Status = this.registry.register(new Status(407, 'Proxy Authentication Required'));
  public static readonly RequestTimeout: Status = this.registry.register(new Status(408, 'Request Timeout'));
  public static readonly Conflict: Status = this.registry.register(new Status(409, 'Conflict'));
  public static readonly Gone: Status = this.registry.register(new Status(410, 'Gone'));
  public static readonly LengthRequired: Status = this.registry.register(new Status(411, 'Length Required'));
  public static readonly PreconditionFailed: Status = this.registry.register(new Status(412, 'Precondition Failed'));
  public static readonly PayloadTooLarge: Status = this.registry.register(new Status(413, 'Payload Too Large'));
  public static readonly UriTooLong: Status = this.registry.register(new Status(414, 'URI Too Long'));
  public static readonly UnsupportedMediaType: Status = this.registry.register(new Status(415, 'Unsupported Media Type'));
  public static readonly RangeNotSatisfiable: Status = this.registry.register(new Status(416, 'Range Not Satisfiable'));
  public static readonly ExpectationFailed: Status = this.registry.register(new Status(417, 'Expectation Failed'));
  public static readonly ImATeapot: Status = this.registry.register(new Status(418, 'I\'m A Teapot'));
  public static readonly MisdirectedRequest: Status = this.registry.register(new Status(421, 'Misdirected Request'));
  public static readonly UnprocessableEntity: Status = this.registry.register(new Status(422, 'Unprocessable Entity'));
  public static readonly Locked: Status = this.registry.register(new Status(423, 'Locked'));
  public static readonly FailedDependency: Status = this.registry.register(new Status(424, 'Failed Dependency'));
  public static readonly TooEarly: Status = this.registry.register(new Status(425, 'Too Early'));
  public static readonly UpgradeRequired: Status = this.registry.register(new Status(426, 'Upgrade Required'));
  public static readonly PreconditionRequired: Status = this.registry.register(new Status(428, 'Precondition Required'));
  public static readonly TooManyRequests: Status = this.registry.register(new Status(429, 'Too Many Requests'));
  public static readonly RequestHeaderFieldsTooLarge: Status = this.registry.register(new Status(431, 'Request Header Fields Too Large'));
  public static readonly UnavailableForLegalReasons: Status = this.registry.register(new Status(451, 'Unavailable For Legal Reasons'));

  public static readonly InternalServerError: Status = this.registry.register(new Status(500, 'Internal Server Error'));
  public static readonly NotImplemented: Status = this.registry.register(new Status(501, 'Not Implemented'));
  public static readonly BadGateway: Status = this.registry.register(new Status(502, 'Bad Gateway'));
  public static readonly ServiceUnavailable: Status = this.registry.register(new Status(503, 'Service Unavailable'));
  public static readonly GatewayTimeout: Status = this.registry.register(new Status(504, 'Gateway Timeout'));
  public static readonly HttpVersionNotSupported: Status = this.registry.register(new Status(505, 'HTTP Version not supported'));
  public static readonly VariantAlsoNegotiates: Status = this.registry.register(new Status(506, 'Variant Also Negotiates'));
  public static readonly InsufficientStorage: Status = this.registry.register(new Status(507, 'Insufficient Storage'));
  public static readonly LoopDetected: Status = this.registry.register(new Status(508, 'Loop Detected'));
  public static readonly NotExtended: Status = this.registry.register(new Status(510, 'Not Extended'));
  public static readonly NetworkAuthenticationRequired: Status = this.registry.register(new Status(511, 'Network Authentication Required'));
  /* eslint-enable prettier/prettier */

  public static readonly registered = this.registry.all;
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
