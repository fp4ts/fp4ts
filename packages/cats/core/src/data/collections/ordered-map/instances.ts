import { $, Kind } from '@cats4ts/core';
import { Eval } from '../../../eval';
import { Eq } from '../../../eq';
import { Ord } from '../../../ord';
import { Monoid } from '../../../monoid';
import { Applicative } from '../../../applicative';
import { SemigroupK } from '../../../semigroup-k';
import { MonoidK } from '../../../monoid-k';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { Foldable } from '../../../foldable';
import { Traversable } from '../../../traversable';

import { OrderedMapK } from './ordered-map';
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
  popMax,
  sequence,
  size,
  traverse_,
  union_,
} from './operators';
import { empty } from './constructors';
import { OrderedMap } from './ordered-map';

export const orderedMapEq: <K, V>(
  EK: Eq<K>,
  EV: Eq<V>,
) => Eq<OrderedMap<K, V>> = (EK, EV) =>
  Eq.of({ equals: (xs, ys) => equals_(EK, EV, xs, ys) });

export const orderedMapSemigroupK: <K>(
  O: Ord<K>,
) => SemigroupK<$<OrderedMapK, [K]>> = O =>
  SemigroupK.of({ combineK_: (x, y) => union_(O, x, y()) });

export const orderedMapMonoidK: <K>(O: Ord<K>) => MonoidK<$<OrderedMapK, [K]>> =
  O =>
    MonoidK.of({
      emptyK: () => empty,
      combineK_: (x, y) => union_(O, x, y()),
    });

export const orderedMapFunctor: <K>() => Functor<$<OrderedMapK, [K]>> = () =>
  Functor.of({ map_: (fa, f) => map_(fa, x => f(x)) });

export const orderedMapFunctorFilter: <K>() => FunctorFilter<
  $<OrderedMapK, [K]>
> = () =>
  FunctorFilter.of({
    ...orderedMapFunctor(),
    mapFilter_: (fa, p) => collect_(fa, x => p(x)),
  });

export const orderedMapFoldable: <K>() => Foldable<$<OrderedMapK, [K]>> = () =>
  Foldable.of({
    foldLeft_: (m, z, f) => foldLeft_(m, z, (z, x) => f(z, x)),
    foldRight_: <K, V, B>(
      m0: OrderedMap<K, V>,
      z: Eval<B>,
      f: (v: V, eb: Eval<B>) => Eval<B>,
    ): Eval<B> => {
      const loop = (m: OrderedMap<K, V>): Eval<B> =>
        popMax(m).fold(
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
      <K, V>(m: OrderedMap<K, V>, f: (x: V) => M) =>
        foldMap_(M)(m, x => f(x)),
    all_: (m, p) => all_(m, x => p(x)),
    any_: (m, p) => any_(m, x => p(x)),
    count_: (m, p) => count_(m, x => p(x)),
    isEmpty: isEmpty,
    nonEmpty: nonEmpty,
    size: size,
  });

export const orderedMapTraversable: <K>() => Traversable<$<OrderedMapK, [K]>> =
  () =>
    Traversable.of({
      ...orderedMapFunctor(),
      ...orderedMapFoldable(),

      traverse_:
        <G>(G: Applicative<G>) =>
        <K, V, B>(m: OrderedMap<K, V>, f: (x: V) => Kind<G, [B]>) =>
          traverse_(G)(m, x => f(x)),
      sequence: sequence,
    });
