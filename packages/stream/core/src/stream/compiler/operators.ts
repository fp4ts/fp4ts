import { AnyK, Kind } from '@cats4ts/core';
import { Chunk } from '../../chunk';
import { Compiler } from './compiler';

export const foldChunks: <A2, B>(
  init: B,
  f: (b: B, chunk: Chunk<A2>) => B,
) => <F extends AnyK, A extends A2>(c: Compiler<F, A>) => Kind<F, [B]> =
  (init, f) => c =>
    foldChunks_(c, init, f);

// -- Point-ful operators

export const fold_ = <F extends AnyK, A, B>(
  c: Compiler<F, A>,
  init: B,
  f: (b: B, a: A) => B,
): Kind<F, [A]> => foldChunks_(c, init, (b, c) => c.foldLeft(b, f));

export const foldChunks_ = <F extends AnyK, A, B>(
  c: Compiler<F, A>,
  init: B,
  f: (b: B, chunk: Chunk<A>) => B,
): Kind<F, [B]> => c._underlying.compile(c.F)(init, f);
