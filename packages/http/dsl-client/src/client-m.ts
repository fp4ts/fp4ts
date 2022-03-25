// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, TyK, TyVar } from '@fp4ts/core';
import { Kleisli } from '@fp4ts/cats';
import { Client } from '@fp4ts/http-client';
import { Request } from '@fp4ts/http-core';

export type ClientM<F, A> = Kleisli<F, Client<F>, A>;
export const ClientM = Kleisli;

export interface ClientMF extends TyK<[unknown, unknown]> {
  [$type]: (
    req: Request<TyVar<this, 0>>,
  ) => ClientM<TyVar<this, 0>, TyVar<this, 1>>;
}
