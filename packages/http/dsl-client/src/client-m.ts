// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, instance, pipe, TyK, TyVar } from '@fp4ts/core';
import { EitherT, MonadThrow } from '@fp4ts/cats';
import { IO, IOF } from '@fp4ts/effect';
import { Client } from '@fp4ts/http-client';
import { ClientError, ConnectionFailure } from './client-error';
import { RunClient } from './internal/run-client';

export type ClientM<F, A> = EitherT<F, ClientError<F>, A>;
export const ClientM = Object.freeze({
  RunClient<F>(
    client: Client<F>,
    F: MonadThrow<F>,
  ): RunClient<$<ClientMF, [F]>, F> {
    return instance<RunClient<$<ClientMF, [F]>, F>>({
      ...EitherT.Monad<F, ClientError<F>>(F),
      runRequest: req =>
        pipe(
          client.fetch(req, F.pure),
          F.attempt,
          F.map(ea => ea.leftMap(e => new ConnectionFailure(e))),
          EitherT,
        ),
      throwClientError: err => EitherT.left(F)(err),
    });
  },

  RunClientIO(client: Client<IOF>): RunClient<$<ClientMF, [IOF]>, IOF> {
    return ClientM.RunClient(client, IO.MonadError);
  },
});

export interface ClientMF extends TyK<[unknown, unknown]> {
  [$type]: ClientM<TyVar<this, 0>, TyVar<this, 1>>;
}
