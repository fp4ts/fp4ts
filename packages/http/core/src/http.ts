// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Kleisli } from '@fp4ts/cats';
import { Request, Response } from './messages';

export type Http<F, G> = Kleisli<F, Request<G>, Response<G>>;
export function Http<F, G>(
  run: (req: Request<G>) => Kind<F, [Response<G>]>,
): Http<F, G> {
  return Kleisli(run);
}
