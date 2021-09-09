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
import { flatMap_, flatTap_, flatten, map_, or_ } from './operators';
import { none, pure } from './constructors';

export const optionSemigroupK: Lazy<SemigroupK<URI>> = () =>
  SemigroupK.of({ URI, combineK_: or_ });

export const optionMonoidK: Lazy<MonoidK<URI>> = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { algebra, ...rest } = optionSemigroupK();
  return MonoidK.of({ ...rest, emptyK: () => none });
};

export const optionFunctor: Lazy<Functor<URI>> = () =>
  Functor.of({ URI, map_ });

export const optionApply: Lazy<Apply<URI>> = () =>
  Apply.of({
    ...optionFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  });

export const optionApplicative: Lazy<Applicative<URI>> = () =>
  Applicative.of({
    ...optionApply(),
    pure: pure,
  });

export const optionAlternative: Lazy<Alternative<URI>> = () => ({
  ...optionApplicative(),
  ...optionMonoidK(),
});

export const optionFlatMap: Lazy<FlatMap<URI>> = () =>
  FlatMap.of({
    ...optionApply(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
  });

export const optionMonad: Lazy<Monad<URI>> = () => ({
  ...optionApplicative(),
  ...optionFlatMap(),
});
