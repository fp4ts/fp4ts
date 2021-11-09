import { id, Lazy, lazyVal, Kind } from '@fp4ts/core';
import {
  Alternative,
  Functor,
  FunctorFilter,
  Monad,
  MonoidK,
  Traversable,
  Eval,
  Applicative,
} from '@fp4ts/cats';

import { Chunk as ChunkBase } from './algebra';
import type { ChunkK, Chunk } from './chunk';

export const chunkMonoidK: Lazy<MonoidK<ChunkK>> = lazyVal(() =>
  MonoidK.of({
    emptyK: () => ChunkBase.empty,
    combineK_: (lhs, rhs) => lhs.concat(rhs()),
  }),
);

export const chunkFunctor: Lazy<Functor<ChunkK>> = lazyVal(() =>
  Functor.of({ map_: (x, f) => x.map(f) }),
);

export const chunkFunctorFilter: Lazy<FunctorFilter<ChunkK>> = lazyVal(() =>
  FunctorFilter.of({
    ...chunkFunctor(),
    mapFilter_: (x, f) => x.collect(f),
    collect_: (x, f) => x.collect(f),
  }),
);

export const chunkAlternative: Lazy<Alternative<ChunkK>> = lazyVal(() =>
  Alternative.of({ ...chunkMonad(), ...chunkMonoidK() }),
);

export const chunkMonad: Lazy<Monad<ChunkK>> = lazyVal(() =>
  Monad.of({
    pure: ChunkBase.singleton,
    flatMap_: (xs, f) => xs.flatMap(f),
    flatten: xs => xs.flatMap(id),
    tailRecM_: ChunkBase.tailRecM_,
  }),
);

export const chunkTraversable: Lazy<Traversable<ChunkK>> = lazyVal(() =>
  Traversable.of({
    ...chunkFunctor(),
    foldLeft_: (xs, z, f) => xs.foldLeft(z, f),
    foldRight_: <A, B>(
      fa: Chunk<A>,
      b: Eval<B>,
      f: (a: A, b: Eval<B>) => Eval<B>,
    ): Eval<B> => {
      const go = (i: number): Eval<B> =>
        i < fa.size
          ? f(
              fa.elem(i),
              Eval.defer(() => go(i + 1)),
            )
          : b;
      return go(0);
    },
    traverse_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: Chunk<A>, f: (a: A) => Kind<G, [B]>): Kind<G, [Chunk<B>]> =>
        fa.traverse(G)(f),
  }),
);
