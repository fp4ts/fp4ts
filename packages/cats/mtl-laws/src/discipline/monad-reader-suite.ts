// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { MonadReader } from '@fp4ts/cats-mtl';
import { MonadSuite } from '@fp4ts/cats-laws';
import { LocalSuite } from './local-suite';

export function MonadReaderSuite<F, R>(F: MonadReader<F, R>) {
  return {
    ...LocalSuite(F),
    ...MonadSuite(F),
  };
}
