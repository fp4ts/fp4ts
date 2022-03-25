// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Monad } from '@fp4ts/cats';
import { Request, Response } from '@fp4ts/http-core';
import { ClientError } from '../client-error';

export interface RunClient<G, F> extends Monad<G> {
  runRequest(req: Request<F>): Kind<G, [Response<F>]>;
  throwClientError<A = never>(e: ClientError<F>): Kind<G, [A]>;
}

type RunClientRequirements<G, F> = Pick<
  RunClient<G, F>,
  'runRequest' | 'throwClientError'
>;
export const RunClient = Object.freeze({
  of: <G, F>(G: Monad<G>, R: RunClientRequirements<G, F>): RunClient<G, F> => ({
    ...G,
    ...R,
  }),
});
