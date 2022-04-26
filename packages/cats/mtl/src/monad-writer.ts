// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Monad } from '@fp4ts/cats-core';
import { Censor } from './censor';

export interface MonadWriter<F, W> extends Monad<F>, Censor<F, W> {}
