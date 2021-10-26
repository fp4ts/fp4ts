import { id, Lazy, lazyVal } from '@fp4ts/core';
import { Align } from '../../../align';
import { Eq } from '../../../eq';
import { Eval } from '../../../eval';
import { SemigroupK } from '../../../semigroup-k';
import { MonoidK } from '../../../monoid-k';
import { Applicative } from '../../../applicative';
import { Alternative } from '../../../alternative';
import { Apply } from '../../../apply';
import { FlatMap } from '../../../flat-map';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { Monad } from '../../../monad';
import { Foldable } from '../../../foldable';
import { Traversable } from '../../../traversable';

import { List, ListK } from './list';

import { empty, pure } from './constructors';
import {
  align_,
  all_,
  any_,
  collect_,
  concat_,
  count_,
  elemOption_,
  equals_,
  flatMap_,
  flatten,
  foldLeft_,
  foldMap_,
  fold_,
  isEmpty,
  iterator,
  map_,
  nonEmpty,
  sequence,
  size,
  tailRecM_,
  tap_,
  traverse_,
  zipAll_,
} from './operators';

export const listEq: <A>(E: Eq<A>) => Eq<List<A>> = E =>
  Eq.of({ equals: (xs, ys) => equals_(E, xs, ys) });

export const listSemigroupK: Lazy<SemigroupK<ListK>> = lazyVal(() =>
  SemigroupK.of({ combineK_: (x, y) => concat_(x, y()) }),
);

export const listMonoidK: Lazy<MonoidK<ListK>> = lazyVal(() => {
  const { algebra, ...rest } = listSemigroupK();
  return MonoidK.of({ ...rest, emptyK: () => empty });
});

export const listAlign: Lazy<Align<ListK>> = lazyVal(() =>
  Align.of({
    functor: listFunctor(),
    align_: align_,
    zipAll: (xs, ys, a, b) =>
      zipAll_(
        xs,
        ys,
        () => a,
        () => b,
      ),
  }),
);

export const listFunctor: Lazy<Functor<ListK>> = lazyVal(() =>
  Functor.of({ map_ }),
);

export const listFunctorFilter: Lazy<FunctorFilter<ListK>> = lazyVal(() =>
  FunctorFilter.of({
    ...listFunctor(),
    mapFilter_: collect_,
  }),
);

export const listApply: Lazy<Apply<ListK>> = lazyVal(() =>
  Apply.of({
    ...listFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  }),
);

export const listApplicative: Lazy<Applicative<ListK>> = lazyVal(() =>
  Applicative.of({
    ...listApply(),
    pure: pure,
    unit: pure(undefined),
  }),
);

export const listAlternative: Lazy<Alternative<ListK>> = lazyVal(() =>
  Alternative.of({
    ...listApplicative(),
    ...listMonoidK(),
  }),
);

export const listFlatMap: Lazy<FlatMap<ListK>> = lazyVal(() =>
  FlatMap.of({
    ...listApply(),
    flatMap_: flatMap_,
    flatTap_: tap_,
    flatten: flatten,
    tailRecM_: tailRecM_,
  }),
);

export const listMonad: Lazy<Monad<ListK>> = lazyVal(() =>
  Monad.of({
    ...listApplicative(),
    ...listFlatMap(),
  }),
);

export const listFoldable: Lazy<Foldable<ListK>> = lazyVal(() =>
  Foldable.of({
    isEmpty: isEmpty,
    nonEmpty: nonEmpty,
    size: size,
    all_: all_,
    any_: any_,
    count_: count_,
    foldMap_: foldMap_,
    foldLeft_: foldLeft_,
    foldRight_: <A, B>(
      xs: List<A>,
      eb: Eval<B>,
      f: (a: A, eb: Eval<B>) => Eval<B>,
    ): Eval<B> => {
      const loop = (xs: List<A>): Eval<B> =>
        fold_(
          xs,
          () => eb,
          (hd, tl) =>
            f(
              hd,
              Eval.defer(() => loop(tl)),
            ),
        );

      return loop(xs);
    },
    elem_: elemOption_,
    iterator: iterator,
    toList: id,
  }),
);

export const listTraversable: Lazy<Traversable<ListK>> = lazyVal(() =>
  Traversable.of({
    ...listFoldable(),
    ...listFunctor(),
    traverse_: traverse_,
    sequence: sequence,
  }),
);
