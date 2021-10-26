import { Lazy, lazyVal } from '@fp4ts/core';
import {
  Alternative,
  Functor,
  FunctorFilter,
  Monad,
  MonoidK,
  Traversable,
} from '@fp4ts/cats';

import { ChunkK } from './chunk';
import { empty, singleton, tailRecM_ } from './constructor';
import {
  collect_,
  concat_,
  flatMap_,
  flatten,
  foldLeft_,
  foldRight_,
  map_,
  traverse_,
} from './operators';

export const chunkMonoidK: Lazy<MonoidK<ChunkK>> = lazyVal(() =>
  MonoidK.of({
    emptyK: () => empty,
    combineK_: (lhs, rhs) => concat_(lhs, rhs()),
  }),
);

export const chunkFunctor: Lazy<Functor<ChunkK>> = lazyVal(() =>
  Functor.of({ map_: map_ }),
);

export const chunkFunctorFilter: Lazy<FunctorFilter<ChunkK>> = lazyVal(() =>
  FunctorFilter.of({
    ...chunkFunctor(),
    mapFilter_: collect_,
    collect_: collect_,
  }),
);

export const chunkAlternative: Lazy<Alternative<ChunkK>> = lazyVal(() =>
  Alternative.of({ ...chunkMonad(), ...chunkMonoidK() }),
);

export const chunkMonad: Lazy<Monad<ChunkK>> = lazyVal(() =>
  Monad.of({
    pure: singleton,
    flatMap_: flatMap_,
    flatten: flatten,
    tailRecM_: tailRecM_,
  }),
);

export const chunkTraversable: Lazy<Traversable<ChunkK>> = lazyVal(() =>
  Traversable.of({
    ...chunkFunctor(),
    foldLeft_: foldLeft_,
    foldRight_: foldRight_,
    traverse_: traverse_,
  }),
);
