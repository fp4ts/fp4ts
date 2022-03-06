// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import { Kleisli, OptionTF } from '@fp4ts/cats';
import {
  Request,
  AuthedRequest,
  ContextRequest,
  Response,
} from '@fp4ts/http-core';

export type Middleware<F, A, B, C, D> = (
  k: Kleisli<F, A, B>,
) => Kleisli<F, C, D>;

export type HttpMiddleware<F> = Middleware<
  $<OptionTF, [F]>,
  Request<F>,
  Response<F>,
  Request<F>,
  Response<F>
>;

export type AuthMiddleware<F, A> = Middleware<
  $<OptionTF, [F]>,
  AuthedRequest<F, A>,
  Response<F>,
  Request<F>,
  Response<F>
>;

export type ContextMiddleware<F, A> = Middleware<
  $<OptionTF, [F]>,
  ContextRequest<F, A>,
  Response<F>,
  Request<F>,
  Response<F>
>;
