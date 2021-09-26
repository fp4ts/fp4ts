import { instance, Lazy } from '@cats4ts/core';
import { Defer } from '../defer';
import { Functor } from '../functor';
import { Apply } from '../apply';
import { Applicative } from '../applicative';
import { FlatMap } from '../flat-map';
import { Monad } from '../monad';

import { EvalK } from './eval';
import { defer, pure } from './constructors';
import { flatMap_, map_, tailRecM_ } from './operators';

export const evalDefer: Lazy<Defer<EvalK>> = () => Defer.of({ defer });

export const evalFunctor: Lazy<Functor<EvalK>> = () =>
  Functor.of({ map_: map_ });

export const evalApply: Lazy<Apply<EvalK>> = () =>
  Apply.of({
    ...evalFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  });

export const evalApplicative: Lazy<Applicative<EvalK>> = () =>
  Applicative.of({
    ...evalFunctor(),
    ...evalApply(),
    pure: pure,
  });

export const evalFlatMap: Lazy<FlatMap<EvalK>> = () =>
  FlatMap.of({
    ...evalApply(),
    flatMap_: flatMap_,
    tailRecM_: tailRecM_,
  });

export const evalMonad: Lazy<Monad<EvalK>> = () =>
  Monad.of({
    ...evalApplicative(),
    ...evalFlatMap(),
  });
