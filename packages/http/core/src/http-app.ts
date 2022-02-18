// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Http } from './http';
import { Request, Response } from './messages';

export type HttpApp<F> = Http<F, F>;
export function HttpApp<F>(
  run: (request: Request<F>) => Kind<F, [Response<F>]>,
): HttpApp<F> {
  return Http(run);
}
