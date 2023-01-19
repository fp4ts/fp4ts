// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { MonadError, MonadErrorRequirements } from './monad-error';

/**
 * Version of the `MonadError` with fixed error type to be `Error`
 *
 * @category Type Class
 */
export interface MonadThrow<F> extends MonadError<F, Error> {}

export type MonadThrowRequirements<F> = MonadErrorRequirements<F, Error>;

export const MonadThrow = Object.freeze({
  of: <F>(F: MonadThrowRequirements<F>): MonadThrow<F> => MonadError.of(F),
});
