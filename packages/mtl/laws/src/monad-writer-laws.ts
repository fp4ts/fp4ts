// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { MonadLaws } from '@fp4ts/cats-laws';
import { MonadWriter } from '@fp4ts/mtl-core';
import { CensorLaws } from './censor-laws';

export const MonadWriterLaws = <F, W>(F: MonadWriter<F, W>) => ({
  ...CensorLaws(F),
  ...MonadLaws(F),
});
