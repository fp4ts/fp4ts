// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy, lazyVal } from '@fp4ts/core';
import { Identity, IdentityF, None, Some } from '@fp4ts/cats';
import { Ref, Sync, Concurrent, SyncIO } from '@fp4ts/effect';

import { Chunk } from '../chunk';
import { Pull } from '../pull';
import { PureF } from '../pure';
import { Compiler } from './compiler';
import { CompilerTarget } from './target';
import { InterruptContext } from '../internal';

export const compilerTargetInstance = (() => {
  const cache = new Map<any, Compiler<any, any>>();
  return <F>(T: CompilerTarget<F>): Compiler<F, F> => {
    if (cache.has(T)) {
      return cache.get(T)!;
    }
    const instance = {
      target: T.F,
      compile: T.compile_,
    };
    cache.set(T, instance);
    return instance;
  };
})();

export const compilerSyncTarget = <F>(F: Sync<F>): Compiler<F, F> =>
  compilerTargetInstance(syncTarget(F));

export const compilerConcurrentTarget = <F>(
  F: Concurrent<F, Error>,
): Compiler<F, F> => compilerTargetInstance(concurrentTarget(F));

export const compilerPureInstance: Lazy<Compiler<PureF, IdentityF>> = lazyVal(
  () => ({
    target: Identity.Monad,
    compile:
      <O, B>(pull: Pull<PureF, O, void>, init: B) =>
      (foldChunk: (b: B, c: Chunk<O>) => B): Identity<B> =>
        compilerSyncTarget(SyncIO.Sync)
          .compile(
            pull,
            init,
          )(foldChunk)
          .unsafeRunSync(),
  }),
);

export const compilerIdentityInstance: Lazy<Compiler<IdentityF, IdentityF>> =
  lazyVal(() => ({
    target: Identity.Monad,
    compile:
      <O, B>(pull: Pull<IdentityF, O, void>, init: B) =>
      (foldChunk: (b: B, c: Chunk<O>) => B): Identity<B> =>
        compilerSyncTarget(SyncIO.Sync)
          .compile(
            pull.covaryId(SyncIO.Applicative),
            init,
          )(foldChunk)
          .unsafeRunSync(),
  }));

// -- Target Instances

export const syncTarget = (() => {
  const cache = new Map<any, CompilerTarget<any>>();
  return <F>(F: Sync<F>): CompilerTarget<F> => {
    if (cache.has(F)) {
      return cache.get(F)!;
    }
    const instance = CompilerTarget.of({
      F,
      ref: Ref.of(F),
      unique: F.unique,
      interruptContext: () => None,
    });
    cache.set(F, instance);
    return instance;
  };
})();

export const concurrentTarget = (() => {
  const cache = new Map<any, CompilerTarget<any>>();
  return <F>(F: Concurrent<F, Error>): CompilerTarget<F> => {
    if (cache.has(F)) {
      return cache.get(F)!;
    }
    const instance = CompilerTarget.of({
      F,
      ref: F.ref,
      unique: F.unique,
      interruptContext: root => Some(InterruptContext.create(F)(root, F.unit)),
    });
    cache.set(F, instance);
    return instance;
  };
})();
