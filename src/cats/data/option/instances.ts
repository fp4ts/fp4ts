import { Lazy } from '../../../fp/core';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Alternative } from '../../alternative';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';

import { URI } from './option';
import { flatMap, flatMap_, flatTap, flatten, map_, or_ } from './operators';
import { none, pure } from './constructors';

export const optionSemigroupK: Lazy<SemigroupK<URI>> = () => ({
  URI: URI,
  combineK: or_,
  algebra: () => ({
    combine: or_,
  }),
});

export const optionMonoidK: Lazy<MonoidK<URI>> = () => ({
  ...optionSemigroupK(),
  emptyK: () => none,
  algebra: () => ({
    combine: or_,
    empty: none,
  }),
});

export const optionFunctor: Lazy<Functor<URI>> = () =>
  Functor.of({ URI, map_ });

export const optionApply: Lazy<Apply<URI>> = () => ({
  ...optionFunctor(),
  ap: ff => fa => flatMap_(ff, f => map_(fa, a => f(a))),
  map2: (fa, fb) => f => flatMap_(fa, a => map_(fb, b => f(a, b))),
  product: (fa, fb) => flatMap_(fa, a => map_(fb, b => [a, b])),
  productL: (fa, fb) => flatMap_(fa, a => map_(fb, () => a)),
  productR: (fa, fb) => flatMap_(fa, () => map_(fb, b => b)),
});

export const optionApplicative: Lazy<Applicative<URI>> = () => ({
  ...optionApply(),
  pure: pure,
  unit: pure(undefined),
});

export const optionAlternative: Lazy<Alternative<URI>> = () => ({
  ...optionApplicative(),
  ...optionMonoidK(),
});

export const optionFlatMap: Lazy<FlatMap<URI>> = () => ({
  ...optionApply(),
  flatMap: flatMap,
  flatTap: flatTap,
  flatten: flatten,
});

export const optionMonad: Lazy<Monad<URI>> = () => ({
  ...optionApplicative(),
  ...optionFlatMap(),
});
