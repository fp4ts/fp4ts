// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Option } from '@fp4ts/cats';
import { Ref, UniqueToken, Resource, MonadCancelThrow } from '@fp4ts/effect';

import { Chunk } from '../chunk';
import { InterruptContext, Scope } from '../internal';
import { Pull } from '../pull';
import { concurrentTarget, syncTarget } from './instances';

export interface CompilerTarget<F> {
  readonly F: MonadCancelThrow<F>;
  readonly unique: Kind<F, [UniqueToken]>;
  readonly ref: <A>(a: A) => Kind<F, [Ref<F, A>]>;
  readonly interruptContext: (
    root: UniqueToken,
  ) => Option<Kind<F, [InterruptContext<F>]>>;

  readonly compile: <O, Out>(
    init: Out,
    foldChunk: (out: Out, c: Chunk<O>) => Out,
  ) => (pull: Pull<F, O, void>) => Kind<F, [Out]>;
  readonly compile_: <O, Out>(
    pull: Pull<F, O, void>,
    init: Out,
  ) => (foldChunk: (out: Out, c: Chunk<O>) => Out) => Kind<F, [Out]>;
}
export type TargetRequirements<F> = Pick<
  CompilerTarget<F>,
  'F' | 'ref' | 'unique' | 'interruptContext'
> &
  Partial<CompilerTarget<F>>;
export const CompilerTarget = Object.freeze({
  of: <F>(F: TargetRequirements<F>): CompilerTarget<F> => {
    const self: CompilerTarget<F> = {
      compile: (init, foldChunk) => pull =>
        self.compile_(pull, init)(foldChunk),
      compile_: (pull, init) => foldChunk =>
        Resource.make(self.F)(Scope.newRoot(self), (scope, ec) =>
          self.F.rethrow(scope.close(ec)),
        ).use(self.F)(scope => pull.compile(self.F)(init, scope, foldChunk)),

      ...F,
    };
    return self;
  },

  get sync() {
    return syncTarget;
  },

  get concurrent() {
    return concurrentTarget;
  },
});
