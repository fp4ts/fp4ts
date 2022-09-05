// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy, lazyVal } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Align } from '../../../align';
import { MonoidK } from '../../../monoid-k';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { Alternative } from '../../../alternative';
import { CoflatMap } from '../../../coflat-map';
import { Monad } from '../../../monad';
import { Traversable } from '../../../traversable';
import { Eval } from '../../../eval';

import type { ChainF } from './chain';
import { Chain } from './algebra';
import {
  align_,
  coflatMap_,
  collect_,
  concat_,
  equals_,
  filter_,
  flatMap_,
  foldLeft_,
  foldMap_,
  map_,
  traverse_,
} from './operators';
import { empty, pure, tailRecM_ } from './constructors';

export const chainEq = <A>(E: Eq<A>): Eq<Chain<A>> =>
  Eq.of({ equals: equals_(E) });

export const chainAlign: Lazy<Align<ChainF>> = lazyVal(() =>
  Align.of({ align_: align_, functor: chainFunctor() }),
);

export const chainMonoidK: Lazy<MonoidK<ChainF>> = lazyVal(() =>
  MonoidK.of({ emptyK: () => empty, combineK_: (xs, ys) => concat_(xs, ys()) }),
);

export const chainFunctor: Lazy<Functor<ChainF>> = lazyVal(() =>
  Functor.of({ map_ }),
);

export const chainFunctorFilter: Lazy<FunctorFilter<ChainF>> = lazyVal(() =>
  FunctorFilter.of({
    ...chainFunctor(),
    mapFilter_: collect_,
    collect_,
    filter_: filter_,
  }),
);

export const chainAlternative: Lazy<Alternative<ChainF>> = lazyVal(() =>
  Alternative.of({ ...chainMonad(), ...chainMonoidK() }),
);

export const chainCoflatMap: Lazy<CoflatMap<ChainF>> = lazyVal(() =>
  CoflatMap.of({ ...chainFunctor(), coflatMap_ }),
);

export const chainMonad: Lazy<Monad<ChainF>> = lazyVal(() =>
  Monad.of({
    pure: pure,
    flatMap_: flatMap_,
    tailRecM_: tailRecM_,
    map_: map_,
    map2Eval_:
      <A, B>(fa: Chain<A>, efb: Eval<Chain<B>>) =>
      <C>(f: (a: A, b: B) => C) =>
        fa === empty
          ? Eval.now(empty)
          : efb.map(fb => flatMap_(fa, a => map_(fb, b => f(a, b)))),
  }),
);

export const chainTraversable: Lazy<Traversable<ChainF>> = lazyVal(() =>
  Traversable.of({
    ...chainFunctor(),
    foldLeft_: foldLeft_,
    foldMap_: foldMap_,
    traverse_: traverse_,
  }),
);
