import { Kind } from '@fp4ts/core';
import { Ref, UniqueToken, Resource, MonadCancel } from '@fp4ts/effect';

import { Chunk } from '../chunk';
import { Pull } from '../pull';
import { concurrentTarget, syncTarget } from './instances';

export interface CompilerTarget<F> {
  readonly F: MonadCancel<F, Error>;
  readonly unique: Kind<F, [UniqueToken]>;
  readonly ref: <A>(a: A) => Kind<F, [Ref<F, A>]>;

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
  'F' | 'ref' | 'unique'
> &
  Partial<CompilerTarget<F>>;
export const CompilerTarget = Object.freeze({
  of: <F>(F: TargetRequirements<F>): CompilerTarget<F> => {
    const self: CompilerTarget<F> = {
      compile: (init, foldChunk) => pull =>
        self.compile_(pull, init)(foldChunk),
      // compile_: () => throwError(new Error('Not implemented')),
      compile_: (pull, init) => foldChunk =>
        // Resource.make(self.F)(Scope.newRoot(self.F), (scope, ec) =>
        //   self.F.rethrow(scope.close(ec)),
        // ).use(self.F)(scope => pull.compile(self.F)(init, foldChunk)),
        Resource.make(self.F)(self.F.unit, () => self.F.unit).use(self.F)(() =>
          pull.compile(self.F)(init, foldChunk),
        ),

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
