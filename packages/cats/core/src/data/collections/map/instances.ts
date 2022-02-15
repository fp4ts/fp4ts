// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind, lazyVal } from '@fp4ts/core';
import { Eq, Monoid, Ord } from '@fp4ts/cats-kernel';
import { Eval } from '../../../eval';
import { Applicative } from '../../../applicative';
import { SemigroupK } from '../../../semigroup-k';
import { MonoidK } from '../../../monoid-k';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { Foldable } from '../../../foldable';
import { Traversable } from '../../../traversable';

import { MapF } from './map';
import {
  all_,
  any_,
  collect_,
  count_,
  equals_,
  foldLeft_,
  foldMap_,
  isEmpty,
  map_,
  nonEmpty,
  popMin,
  sequence,
  traverse_,
  union_,
} from './operators';
import { empty } from './constructors';
import { Map } from './map';

export const mapEq: <K, V>(EK: Eq<K>, EV: Eq<V>) => Eq<Map<K, V>> = (EK, EV) =>
  Eq.of({ equals: (xs, ys) => equals_(EK, EV, xs, ys) });

export const mapSemigroupK: <K>(O: Ord<K>) => SemigroupK<$<MapF, [K]>> = O =>
  SemigroupK.of({ combineK_: (x, y) => union_(O, x, y()) });

export const mapMonoidK: <K>(O: Ord<K>) => MonoidK<$<MapF, [K]>> = O =>
  MonoidK.of({
    emptyK: () => empty,
    combineK_: (x, y) => union_(O, x, y()),
  });

export const mapFunctor: <K>() => Functor<$<MapF, [K]>> = lazyVal(() =>
  Functor.of({ map_: (fa, f) => map_(fa, x => f(x)) }),
);

export const mapFunctorFilter: <K>() => FunctorFilter<$<MapF, [K]>> = lazyVal(
  () =>
    FunctorFilter.of({
      ...mapFunctor(),
      mapFilter_: (fa, p) => collect_(fa, x => p(x)),
    }),
);

export const mapFoldable: <K>() => Foldable<$<MapF, [K]>> = lazyVal(() =>
  Foldable.of({
    foldLeft_: (m, z, f) => foldLeft_(m, z, (z, x) => f(z, x)),
    foldRight_: <K, V, B>(
      m0: Map<K, V>,
      z: Eval<B>,
      f: (v: V, eb: Eval<B>) => Eval<B>,
    ): Eval<B> => {
      const loop = (m: Map<K, V>): Eval<B> =>
        popMin(m).fold(
          () => z,
          ([hd, tl]) =>
            f(
              hd,
              Eval.defer(() => loop(tl)),
            ),
        );
      return loop(m0);
    },
    foldMap_:
      <M>(M: Monoid<M>) =>
      <K, V>(m: Map<K, V>, f: (x: V) => M) =>
        foldMap_(M)(m, x => f(x)),
    all_: (m, p) => all_(m, x => p(x)),
    any_: (m, p) => any_(m, x => p(x)),
    count_: (m, p) => count_(m, x => p(x)),
    isEmpty: isEmpty,
    nonEmpty: nonEmpty,
    size: x => x.size,
  }),
);

export const mapTraversable: <K>() => Traversable<$<MapF, [K]>> = lazyVal(() =>
  Traversable.of({
    ...mapFunctor(),
    ...mapFoldable(),

    traverse_:
      <G>(G: Applicative<G>) =>
      <K, V, B>(m: Map<K, V>, f: (x: V) => Kind<G, [B]>) =>
        traverse_(G)(m, x => f(x)),
    sequence: sequence,
  }),
);
