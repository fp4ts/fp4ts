// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy, lazyVal } from '@fp4ts/core';
import { Eval } from '../../../eval';
import { Eq } from '../../../eq';
import { Align } from '../../../align';
import { MonoidK } from '../../../monoid-k';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { Alternative } from '../../../alternative';
import { Monad } from '../../../monad';
import { Traversable } from '../../../traversable';

import type { ChainK } from './chain';
import { Chain } from './algebra';
import {
  align_,
  collect_,
  concat_,
  equals_,
  filter_,
  flatMap_,
  foldLeft_,
  map_,
  popHead,
  traverse_,
} from './operators';
import { empty, pure, tailRecM_ } from './constructors';

export const chainEq = <A>(E: Eq<A>): Eq<Chain<A>> =>
  Eq.of({ equals: equals_(E) });

export const chainAlign: Lazy<Align<ChainK>> = lazyVal(() =>
  Align.of({ align_: align_, functor: chainFunctor() }),
);

export const chainMonoidK: Lazy<MonoidK<ChainK>> = lazyVal(() =>
  MonoidK.of({ emptyK: () => empty, combineK_: (xs, ys) => concat_(xs, ys()) }),
);

export const chainFunctor: Lazy<Functor<ChainK>> = lazyVal(() =>
  Functor.of({ map_ }),
);

export const chainFunctorFilter: Lazy<FunctorFilter<ChainK>> = lazyVal(() =>
  FunctorFilter.of({
    ...chainFunctor(),
    mapFilter_: collect_,
    collect_,
    filter_: filter_,
  }),
);

export const chainAlternative: Lazy<Alternative<ChainK>> = lazyVal(() =>
  Alternative.of({ ...chainMonad(), ...chainMonoidK() }),
);

export const chainMonad: Lazy<Monad<ChainK>> = lazyVal(() =>
  Monad.of({
    pure: pure,
    flatMap_: flatMap_,
    tailRecM_: tailRecM_,
    map_: map_,
  }),
);

export const chainTraversable: Lazy<Traversable<ChainK>> = lazyVal(() =>
  Traversable.of({
    ...chainFunctor(),
    foldLeft_: foldLeft_,
    foldRight_: <A, B>(
      xs: Chain<A>,
      eb: Eval<B>,
      f: (a: A, eb: Eval<B>) => Eval<B>,
    ): Eval<B> => {
      const loop = (xs: Chain<A>): Eval<B> =>
        popHead(xs).fold(
          () => eb,
          ([hd, tl]) =>
            f(
              hd,
              Eval.defer(() => loop(tl)),
            ),
        );
      return loop(xs);
    },
    traverse_: traverse_,
  }),
);
