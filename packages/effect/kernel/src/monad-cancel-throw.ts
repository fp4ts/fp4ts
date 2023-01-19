// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import { KleisliF, MonadThrowRequirements, OptionTF } from '@fp4ts/cats';
import { MonadCancel, MonadCancelRequirements } from './monad-cancel';

/**
 * Version of the `MonadCancel` with fixed error type to be `Error`
 *
 * @category Type Class
 */
export interface MonadCancelThrow<F> extends MonadCancel<F, Error> {}

export type MonadCancelThrowRequirements<F> = MonadCancelRequirements<F, Error>;

export const MonadCancelThrow = Object.freeze({
  of: <F>(F: MonadCancelThrowRequirements<F>): MonadCancelThrow<F> =>
    MonadCancel.of(F),

  Uncancelable: <F>(F: MonadThrowRequirements<F>): MonadCancelThrow<F> =>
    MonadCancel.Uncancelable(F),

  forKleisli: <F, R>(
    F: MonadCancelThrow<F>,
  ): MonadCancelThrow<$<KleisliF, [F, R]>> => MonadCancel.forKleisli(F),

  forOptionT: <F>(F: MonadCancelThrow<F>): MonadCancelThrow<$<OptionTF, [F]>> =>
    MonadCancel.forOptionT(F),
});
