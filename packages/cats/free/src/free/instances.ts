// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, lazyVal } from '@fp4ts/core';
import { Monad } from '@fp4ts/cats-core';

import { FreeK } from './free';
import { flatMap_, map_, tailRecM_ } from './operators';
import { pure } from './constructors';

export const freeMonad: <F>() => Monad<$<FreeK, [F]>> = lazyVal(() =>
  Monad.of({
    pure: pure,
    map_: map_,
    flatMap_: flatMap_,
    tailRecM_: tailRecM_,
  }),
);
