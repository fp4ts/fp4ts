import { $, AnyK } from '@cats4ts/core';
import { Monad } from '@cats4ts/cats-core';

import { FreeK } from './free';
import { flatMap_, map_, tailRecM_ } from './operators';
import { pure } from './constructors';

export const freeMonad: <F extends AnyK>() => Monad<$<FreeK, [F]>> = () =>
  Monad.of({
    pure: pure,
    map_: map_,
    flatMap_: flatMap_,
    tailRecM_: tailRecM_,
  });
