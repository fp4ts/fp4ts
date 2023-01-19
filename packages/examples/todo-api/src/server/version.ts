// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Applicative, EitherT } from '@fp4ts/cats';
import { MessageFailure } from '@fp4ts/http';

export const version = <F>(
  F: Applicative<F>,
): EitherT<F, MessageFailure, string> => EitherT.Right(F)('v1.0.0');
