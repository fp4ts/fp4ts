import { $ } from '@cats4ts/core';
import { MonadCancel } from '../monad-cancel';
import {
  canceled,
  pure,
  tailRecM_,
  throwError,
  uncancelable,
} from './constructors';
import { flatMap_, handleErrorWith_, map_, onCancel_ } from './operators';
import { ResourceK } from './resource';

export const resourceMonadCancel: <F>(
  F: MonadCancel<F, Error>,
) => MonadCancel<$<ResourceK, [F]>, Error> = F =>
  MonadCancel.of({
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
    pure: pure,
    flatMap_: flatMap_,
    tailRecM_: tailRecM_,
    throwError: throwError(F),
    handleErrorWith_: handleErrorWith_(F),
    canceled: canceled(F),
    onCancel_: onCancel_(F),
    uncancelable: uncancelable(F),
  });
