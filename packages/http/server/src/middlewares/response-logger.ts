// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { FunctionK, Kleisli } from '@fp4ts/cats';
import { logFormat, LogFormat, Logger, message } from '@fp4ts/logging';
import { MonadCancelThrow } from '@fp4ts/effect';
import { Response } from '@fp4ts/http-core';

export function ResponseLogger<G>(G: MonadCancelThrow<G>): ResponseLogger<G> {
  function responseLogger<F, L>(
    logger: Logger<L, string>,
    nt: FunctionK<L, G>,
    format: ResponseLogFormat<F> = ResponseLogFormat.default(),
  ): <A>(http: Kleisli<G, A, Response<F>>) => Kleisli<G, A, Response<F>> {
    const rpl = logger.format(format);
    return http =>
      Kleisli(req =>
        pipe(
          http(req),
          G.finalize(oc =>
            oc.fold(
              () => nt(logger.info('service canceled response for request')),
              e => nt(logger.info(e, 'service raised an error')),
              frs => G.flatMap_(frs, rs => nt(rpl.info(rs))),
            ),
          ),
        ),
      );
  }

  return responseLogger;
}

export type ResponseLogFormat<F> = LogFormat<Response<F>>;
export const ResponseLogFormat = Object.freeze({
  of: <F>(
    f: (fs: ResponseLogFormats<F>) => ResponseLogFormat<F>,
  ): ResponseLogFormat<F> => f(new ResponseLogFormats()),

  default: <F>(): ResponseLogFormat<F> =>
    ResponseLogFormat.of(
      fmt => logFormat`HTTP/${fmt.httpVersion} ${fmt.status} ${fmt.headers()}`,
    ),
});

interface ResponseLogger<G> {
  <F, L>(
    logger: Logger<L, string>,
    nt: FunctionK<L, G>,
    format?: ResponseLogFormat<F>,
  ): <A>(http: Kleisli<G, A, Response<F>>) => Kleisli<G, A, Response<F>>;
}

class ResponseLogFormats<F> {
  public get httpVersion(): ResponseLogFormat<F> {
    return message({ show: msg => msg.httpVersion });
  }

  public get status(): ResponseLogFormat<F> {
    return message({ show: msg => `${msg.status.code}` });
  }

  public headers(
    isSensitive?: (headerName: string) => boolean,
  ): ResponseLogFormat<F> {
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
