// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  ApplicativeError,
  ApplicativeErrorRequirements,
} from './applicative-error';

/**
 * Version of the `ApplicativeError` with fixed error type to be `Error`
 *
 * @category Type Class
 */
export interface ApplicativeThrow<F> extends ApplicativeError<F, Error> {}

export type ApplicativeThrowRequirements<F> = ApplicativeErrorRequirements<
  F,
  Error
>;

export const ApplicativeThrow = Object.freeze({
  of: <F>(F: ApplicativeThrowRequirements<F>): ApplicativeThrow<F> =>
    ApplicativeError.of(F),
});
