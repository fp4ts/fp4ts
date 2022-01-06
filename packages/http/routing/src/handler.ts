// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Http } from '@fp4ts/http-core';

export type Handler<F> = Http<F, F>;
