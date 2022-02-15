// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, TyK, TyVar } from '@fp4ts/core';
import { EitherT } from '@fp4ts/cats';
import { MessageFailure } from '@fp4ts/http-core';

export type Handler<F, A> = EitherT<F, MessageFailure, A>;

export interface HandlerF extends TyK<[unknown, unknown]> {
  [$type]: Handler<TyVar<this, 0>, TyVar<this, 1>>;
}
