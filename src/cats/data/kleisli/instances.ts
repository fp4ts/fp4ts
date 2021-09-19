import { $, AnyK } from '../../../core';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';

import { KleisliK } from './kleisli';
import { flatMap_, map_, tailRecM_ } from './operators';
import { pure } from './constructors';

export const kleisliFunctor = <F extends AnyK, A>(): Functor<
  $<KleisliK, [F, A]>
> =>
  Functor.of({
    map_: map_,
  });

export const kleisliApply = <F extends AnyK, A>(): Apply<$<KleisliK, [F, A]>> =>
  Apply.of({
    ...kleisliFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  });

export const kleisliApplicative = <F extends AnyK, A>(): Applicative<
  $<KleisliK, [F, A]>
> =>
  Applicative.of({
    ...kleisliFunctor(),
    ...kleisliApplicative(),
    pure: pure,
  });

export const kleisliFlatMap = <F extends AnyK, A>(): FlatMap<
  $<KleisliK, [F, A]>
> =>
  FlatMap.of({
    ...kleisliApply(),
    flatMap_: flatMap_,
    tailRecM_: tailRecM_,
  });

export const kleisliMonad = <F extends AnyK, A>(): Monad<$<KleisliK, [F, A]>> =>
  Monad.of({
    ...kleisliApplicative(),
    ...kleisliFlatMap(),
  });
