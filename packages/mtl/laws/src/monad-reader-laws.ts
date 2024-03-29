// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { MonadLaws } from '@fp4ts/cats-laws';
import { MonadReader } from '@fp4ts/mtl-core';
import { LocalLaws } from './local-laws';

export const MonadReaderLaws = <F, R>(F: MonadReader<F, R>) => ({
  ...LocalLaws(F),
  ...MonadLaws(F),
});
