import { Lazy, URI, V } from '../../../core';
import { SemigroupK } from '../../semigroup-k';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';

import { EitherURI } from './either';
import { flatMap_, map_, or_ } from './operators';
import { pure, rightUnit } from './constructors';

export type Variance = V<'E', '+'> & V<'A', '+'>;

export const eitherSemigroupK: Lazy<
  SemigroupK<[URI<EitherURI, Variance>], Variance>
> = () => SemigroupK.of({ combineK_: or_ });

export const eitherFunctor: Lazy<
  Functor<[URI<EitherURI, Variance>], Variance>
> = () => Functor.of({ map_ });

export const eitherApply: Lazy<Apply<[URI<EitherURI, Variance>], Variance>> =
  () =>
    Apply.of({
      ...eitherFunctor(),
      ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
    });

export const eitherApplicative: Lazy<
  Applicative<[URI<EitherURI, Variance>], Variance>
> = () =>
  Applicative.of({
    ...eitherApply(),
    pure: pure,
    unit: () => rightUnit,
  });

export const eitherFlatMap: Lazy<
  FlatMap<[URI<EitherURI, Variance>], Variance>
> = () => FlatMap.of({ ...eitherApply(), flatMap_: flatMap_ });

export const eitherMonad: Lazy<Monad<[URI<EitherURI, Variance>], Variance>> =
  () =>
    Monad.of({
      ...eitherApplicative(),
      ...eitherFlatMap(),
    });
