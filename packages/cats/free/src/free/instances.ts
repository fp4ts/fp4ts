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
