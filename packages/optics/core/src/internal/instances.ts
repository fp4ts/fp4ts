// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Applicative,
  Const,
  ConstF,
  Contravariant,
  Functor,
  Monoid,
  None,
  Option,
} from '@fp4ts/cats';
import { Tagged } from '@fp4ts/cats-profunctor';
import { $, cached, lazy } from '@fp4ts/core';
import { Indexing } from './indexing';

export const mkFoldConstInstance = cached(<M>(M: Monoid<M>) => ({
  ...Const.Applicative(M),
  ...Const.Contravariant<M>(),
}));

export const mkGetterConstInstance = lazy(<M>() => ({
  ...Const.Functor<M>(),
  ...Const.Contravariant<M>(),
})) as <M>() => Functor<$<ConstF, [M]>> & Contravariant<$<ConstF, [M]>>;

export const mkIndexingInstance = cached(
  <F>(F: Applicative<F> & Contravariant<F>) => ({
    ...Indexing.Applicative(F),
    ...Indexing.Contravariant(F),
  }),
);

export const _firstOption = lazy(
  <A>(): Monoid<Option<A>> =>
    Monoid.of<Option<A>>({
      empty: None,
      combine_: (x, y) => x.orElse(() => y),
      combineEval_: (x, ey) => x.orElseEval(ey),
    }),
) as <A>() => Monoid<Option<A>>;

export const _lastOption = lazy(
  <A>(): Monoid<Option<A>> =>
    Monoid.of<Option<A>>({
      empty: None,
      combine_: (x, y) => y.orElse(() => x),
    }),
) as <A>() => Monoid<Option<A>>;

export const taggedInstance = { ...Tagged.Bifunctor, ...Tagged.Choice };
