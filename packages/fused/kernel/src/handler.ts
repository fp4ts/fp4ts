// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { FunctionK } from '@fp4ts/cats';

export type Handler<H, F, G> = FunctionK<[H, F], [G, H]>;
