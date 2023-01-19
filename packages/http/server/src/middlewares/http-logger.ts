// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose } from '@fp4ts/core';
import { FunctionK } from '@fp4ts/cats';
import { Logger } from '@fp4ts/logging';
import { MonadCancelThrow } from '@fp4ts/effect';
import { Http } from '@fp4ts/http-core';
import { RequestLogFormat, RequestLogger } from './request-logger';
import { ResponseLogFormat, ResponseLogger } from './response-logger';

export function HttpLogger<G>(G: MonadCancelThrow<G>): HttpLogger<G> {
  function httpLogger<F, L>(
    logger: Logger<L, string>,
    nt: FunctionK<L, G>,
    { requestFmt, responseFmt }: Partial<HttpLogFormatters<F>> = {},
  ): (http: Http<G, F>) => Http<G, F> {
    return compose(
      ResponseLogger(G)(logger, nt, responseFmt),
      RequestLogger(G)(logger, nt, requestFmt),
    );
  }

  return httpLogger;
}

interface HttpLogFormatters<F> {
  readonly requestFmt: RequestLogFormat<F>;
  readonly responseFmt: ResponseLogFormat<F>;
}

interface HttpLogger<G> {
  <F, L>(
    logger: Logger<L, string>,
    nt: FunctionK<L, G>,
    fmts?: Partial<HttpLogFormatters<F>>,
  ): (http: Http<G, F>) => Http<G, F>;
}
