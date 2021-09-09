import { Lazy } from '../../../fp/core';
import { SemigroupK2, SemigroupK2C } from '../../semigroup-k';
import { Apply2C, Apply2 } from '../../apply';
import { Applicative2C, Applicative2 } from '../../applicative';
import { Functor2C, Functor2 } from '../../functor';
import { FlatMap2C, FlatMap2 } from '../../flat-map';
import { Monad2C, Monad2 } from '../../monad';

import { URI } from './either';
import { flatMap_, map_, or_ } from './operators';
import { pure, rightUnit } from './constructors';

export const eitherSemigroupK2C: <E>() => SemigroupK2C<URI, E> = () =>
  SemigroupK2C.of({ URI, combineK_: or_ });

export const eitherSemigroupK2: Lazy<SemigroupK2<URI>> = () =>
  SemigroupK2.of({ URI, combineK_: or_ });

export const eitherFunctor2C: <E>() => Functor2C<URI, E> = () =>
  Functor2C.of({ URI, map_ });

export const eitherFunctor2: Lazy<Functor2<URI>> = () =>
  Functor2.of({ URI, map_ });

export const eitherApply2C: <E>() => Apply2C<URI, E> = () =>
  Apply2C.of({
    ...eitherFunctor2C(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  });

export const eitherApply2: Lazy<Apply2<URI>> = () =>
  Apply2.of({
    ...eitherFunctor2(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  });

export const eitherApplicative2C: <E>() => Applicative2C<URI, E> = () =>
  Applicative2C.of({
    ...eitherApply2C(),
    pure: pure,
    unit: rightUnit,
  });

export const eitherApplicative2: Lazy<Applicative2<URI>> = () =>
  Applicative2.of({
    ...eitherApply2(),
    pure: pure,
    unit: rightUnit,
  });

export const eitherFlatMap2C: <E>() => FlatMap2C<URI, E> = () =>
  FlatMap2C.of({ ...eitherApply2C(), flatMap_: flatMap_ });

export const eitherFlatMap2: Lazy<FlatMap2<URI>> = () =>
  FlatMap2.of({ ...eitherApply2(), flatMap_: flatMap_ });

export const eitherMonad2C: <E>() => Monad2C<URI, E> = () => ({
  ...eitherApplicative2C(),
  ...eitherFlatMap2C(),
});

export const eitherMonad2: Lazy<Monad2<URI>> = () => ({
  ...eitherApplicative2(),
  ...eitherFlatMap2(),
});
