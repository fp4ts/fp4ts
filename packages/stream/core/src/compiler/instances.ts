// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy, lazyVal } from '@fp4ts/core';
import { Identity, IdentityK, None, Some } from '@fp4ts/cats';
import { Ref, Sync, Concurrent, SyncIO } from '@fp4ts/effect';

import { Chunk } from '../chunk';
import { Pull } from '../pull';
import { PureK } from '../pure';
import { Compiler } from './compiler';
import { CompilerTarget } from './target';
import { InterruptContext } from '../internal';

export const compilerTargetInstance = <F>(
  T: CompilerTarget<F>,
): Compiler<F, F> => ({
  target: T.F,
  compile: T.compile_,
});

export const compilerSyncTarget = <F>(F: Sync<F>): Compiler<F, F> =>
  compilerTargetInstance(syncTarget(F));

export const compilerConcurrentTarget = <F>(
  F: Concurrent<F, Error>,
): Compiler<F, F> => compilerTargetInstance(concurrentTarget(F));

export const compilerPureInstance: Lazy<Compiler<PureK, IdentityK>> = lazyVal(
  () => ({
    target: Identity.Monad,
    compile:
      <O, B>(pull: Pull<PureK, O, void>, init: B) =>
      (foldChunk: (b: B, c: Chunk<O>) => B): Identity<B> =>
        compilerSyncTarget(SyncIO.Sync)
          .compile(
            pull,
            init,
          )(foldChunk)
          .unsafeRunSync(),
  }),
);

export const compilerIdentityInstance: Lazy<Compiler<IdentityK, IdentityK>> =
  lazyVal(() => ({
    target: Identity.Monad,
    compile:
      <O, B>(pull: Pull<IdentityK, O, void>, init: B) =>
      (foldChunk: (b: B, c: Chunk<O>) => B): Identity<B> =>
        compilerSyncTarget(SyncIO.Sync)
          .compile(
            pull.covaryId(SyncIO.Applicative),
            init,
          )(foldChunk)
          .unsafeRunSync(),
  }));

// -- Target Instances

export const syncTarget = <F>(F: Sync<F>): CompilerTarget<F> =>
  CompilerTarget.of({
    F,
    ref: Ref.of(F),
    unique: F.unique,
    interruptContext: () => None,
  });

export const concurrentTarget = <F>(
  F: Concurrent<F, Error>,
): CompilerTarget<F> =>
  CompilerTarget.of({
    F,
    ref: F.ref,
    unique: F.unique,
    interruptContext: root => Some(InterruptContext.create(F)(root, F.unit)),
  });
