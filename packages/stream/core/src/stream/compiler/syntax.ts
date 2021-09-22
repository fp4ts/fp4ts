import { AnyK, Kind } from '@cats4ts/core';
import { Chunk } from '../../chunk';
import { Compiler } from './compiler';
import { foldChunks_, fold_ } from './operators';

declare module './compiler' {
  interface Compiler<F extends AnyK, A> {
    fold<A2, B>(
      this: Compiler<F, A2>,
      init: B,
      f: (b: B, a: A2) => B,
    ): Kind<F, [B]>;

    foldChunks<A2, B>(
      this: Compiler<F, A2>,
      init: B,
      f: (b: B, chunk: Chunk<A2>) => B,
    ): Kind<F, [B]>;
  }
}

Compiler.prototype.fold = function (init, f) {
  return fold_(this, init, f);
};

Compiler.prototype.foldChunks = function (init, f) {
  return foldChunks_(this, init, f);
};
