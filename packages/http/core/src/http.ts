// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kleisli } from '@fp4ts/cats';
import { Request } from './messages/request';
import { Response } from './messages/response';

export type Http<F, G> = Kleisli<F, Request<G>, Response<G>>;
