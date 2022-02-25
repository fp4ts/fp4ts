// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, lazyVal } from '@fp4ts/core';
import {
  Alternative,
  Functor,
  FunctorFilter,
  Monad,
  MonoidK,
  StackSafeMonad,
} from '@fp4ts/cats';
import { empty, succeed } from './constructors';
import {
  ap_,
  collect_,
  filter_,
  flatMap_,
  map2_,
  map_,
  orElse_,
  productL_,
  productR_,
} from './operators';

import type { ParserTF } from './parser';

export const parserTMonoidK: <S, F>() => MonoidK<$<ParserTF, [S, F]>> = lazyVal(
  () => MonoidK.of({ emptyK: empty, combineK_: orElse_ }),
);

export const parserTFunctor: <S, F>() => Functor<$<ParserTF, [S, F]>> = lazyVal(
  () => Functor.of({ map_: map_ }),
);

export const parserTFunctorFilter: <S, F>() => FunctorFilter<
  $<ParserTF, [S, F]>
> = lazyVal(() =>
  FunctorFilter.of({
    ...parserTFunctor(),
    mapFilter_: collect_,
    collect_,
    filter_,
  }),
);

export const parserTAlternative: <S, F>() => Alternative<$<ParserTF, [S, F]>> =
  lazyVal(<S, F>() =>
    Alternative.of<$<ParserTF, [S, F]>>({
      ...parserTMonoidK<S, F>(),
      ...parserTMonad<S, F>(),
    }),
  ) as <S, F>() => Alternative<$<ParserTF, [S, F]>>;

export const parserTMonad: <S, F>() => Monad<$<ParserTF, [S, F]>> = lazyVal(
  () =>
    StackSafeMonad.of({
      ...parserTFunctor(),
      pure: succeed,
      flatMap_: flatMap_,
      map2_: map2_,
      ap_: ap_,
      productL_: productL_,
      productR_: productR_,
    }),
);
