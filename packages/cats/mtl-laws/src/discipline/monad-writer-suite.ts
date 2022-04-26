// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { MonadSuite } from '@fp4ts/cats-laws';
import { MonadWriter } from '@fp4ts/cats-mtl';
import { CensorSuite } from './censor-suite';

export function MonadWriterSuite<F, W>(F: MonadWriter<F, W>) {
  return {
    ...CensorSuite(F),
    ...MonadSuite(F),
  };
}
