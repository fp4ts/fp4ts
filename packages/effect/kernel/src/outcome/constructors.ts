// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Canceled, Failure, Outcome, Success } from './algebra';

export const success = <F, A>(fa: Kind<F, [A]>): Outcome<F, never, A> =>
  new Success(fa);

export const failure = <F, E>(e: E): Outcome<F, E, never> => new Failure(e);

export const canceled = <F>(): Outcome<F, never, never> => new Canceled();
