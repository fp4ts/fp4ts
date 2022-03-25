// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, Kind } from '@fp4ts/core';
import { Request, Response } from '@fp4ts/http-core';
import { ClientError } from '../client-error';

export interface RunClient<G, F> extends Base<G> {
  runRequest(req: Request<F>): Kind<G, [Response<F>]>;
  throwClientError<A = never>(e: ClientError<F>): Kind<G, [A]>;
}
