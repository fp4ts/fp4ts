// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Monad, IdentityF } from '@fp4ts/cats';

import { Chunk } from '../chunk';
import { Pull } from '../pull';
import { PureF } from '../pure';

import {
  compilerConcurrentTarget,
  compilerIdentityInstance,
  compilerPureInstance,
  compilerSyncTarget,
  compilerTargetInstance,
} from './instances';

export interface Compiler<F, G> {
  readonly target: Monad<G>;
  readonly compile: <O, B>(
    pull: Pull<F, O, void>,
    init: B,
  ) => (foldChunk: (b: B, c: Chunk<O>) => B) => Kind<G, [B]>;
}
export const Compiler = Object.freeze({
  get target() {
    return compilerTargetInstance;
  },

  get targetSync() {
    return compilerSyncTarget;
  },

  get targetConcurrent() {
    return compilerConcurrentTarget;
  },

  get Pure(): Compiler<PureF, IdentityF> {
    return compilerPureInstance();
  },

  get Identity(): Compiler<IdentityF, IdentityF> {
    return compilerIdentityInstance();
  },
});
