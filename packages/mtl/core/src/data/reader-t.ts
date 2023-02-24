// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kleisli, KleisliF } from '@fp4ts/cats';

export type ReaderT<F, R, A> = Kleisli<F, R, A>;
export const ReaderT = Kleisli;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export type ReaderTF = KleisliF;
