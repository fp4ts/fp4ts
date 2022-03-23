// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { FunctionK } from '@fp4ts/cats';
import { logFormat, LogFormat, Logger, message } from '@fp4ts/logging';
import { MonadCancelThrow } from '@fp4ts/effect';
import { Http, Request } from '@fp4ts/http-core';

export function RequestLogger<G>(G: MonadCancelThrow<G>): RequestLogger<G> {
  function requestLogger<F, L>(
    logger: Logger<L, string>,
    nt: FunctionK<L, G>,
    format: RequestLogFormat<F> = RequestLogFormat.default(),
  ): (http: Http<G, F>) => Http<G, F> {
    const rql = logger.format(format);
    return http =>
      Http(req =>
        pipe(
          http.run(req),
          G.finalize(() => nt(rql.info(req))),
        ),
      );
  }

  return requestLogger;
}

export type RequestLogFormat<F> = LogFormat<Request<F>>;
export const RequestLogFormat = Object.freeze({
  of: <F>(
    f: (fs: RequestLogFormats<F>) => RequestLogFormat<F>,
  ): RequestLogFormat<F> => f(new RequestLogFormats()),

  default: <F>(): RequestLogFormat<F> =>
    RequestLogFormat.of(
      fmt =>
        // prettier-ignore
        logFormat`HTTP/${fmt.httpVersion} ${fmt.method} ${fmt.path} ${fmt.headers()}`,
    ),
});

interface RequestLogger<G> {
  <F, L>(
    logger: Logger<L, string>,
    nt: FunctionK<L, G>,
    format?: RequestLogFormat<F>,
  ): (http: Http<G, F>) => Http<G, F>;
}

class RequestLogFormats<F> {
  public get httpVersion(): RequestLogFormat<F> {
    return message({ show: msg => msg.httpVersion });
  }

  public get method(): RequestLogFormat<F> {
    return message({ show: msg => msg.method.methodName });
  }

  public get path(): RequestLogFormat<F> {
    return message({ show: msg => msg.uri.path.toString() });
  }

  public headers(
    isSensitive?: (headerName: string) => boolean,
  ): RequestLogFormat<F> {
    return message({
      show: msg =>
        msg.headers.headers.isEmpty
          ? '[Headers]'
          : `[Headers ${msg.headers
              .redactSensitive(isSensitive)
              .headers.toArray.join(', ')}]`,
    });
  }
}
