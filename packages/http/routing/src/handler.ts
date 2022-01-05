// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import { Kleisli, OptionTK } from '@fp4ts/cats';
import { Request, Response } from '@fp4ts/http-core';

export type Handler<F> = Kleisli<$<OptionTK, [F]>, Request<F>, Response<F>>;
