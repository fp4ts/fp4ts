import { $ } from '@cats4ts/core';
import { SemigroupK } from '../../semigroup-k';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';

import { EitherK } from './either';
import { flatMap_, map_, or_, tailRecM_ } from './operators';
import { pure, rightUnit } from './constructors';

export const eitherSemigroupK: <E>() => SemigroupK<$<EitherK, [E]>> = () =>
  SemigroupK.of({ combineK_: or_ });

export const eitherFunctor: <E>() => Functor<$<EitherK, [E]>> = () =>
  Functor.of({ map_ });

export const eitherApply: <E>() => Apply<$<EitherK, [E]>> = () =>
  Apply.of({
    ...eitherFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  });

export const eitherApplicative: <E>() => Applicative<$<EitherK, [E]>> = () =>
  Applicative.of({
    ...eitherApply(),
    pure: pure,
    unit: rightUnit,
  });

export const eitherFlatMap: <E>() => FlatMap<$<EitherK, [E]>> = () =>
  FlatMap.of({ ...eitherApply(), flatMap_: flatMap_, tailRecM_: tailRecM_ });

export const eitherMonad: <E>() => Monad<$<EitherK, [E]>> = () =>
  Monad.of({
    ...eitherApplicative(),
    ...eitherFlatMap(),
  });
