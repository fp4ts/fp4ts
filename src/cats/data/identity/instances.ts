import { Lazy } from '../../../fp/core';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';

import { URI } from './identity';
import { flatMap, flatMap_, flatTap, flatten, map_ } from './operators';
import { pure, unit } from './constructors';

export const identityFunctor: Lazy<Functor<URI>> = () =>
  Functor.of({ URI, map_ });

export const identityApply: Lazy<Apply<URI>> = () =>
  Apply.of({
    ...identityFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  });

export const identityApplicative: Lazy<Applicative<URI>> = () =>
  Applicative.of({
    ...identityApply(),
    pure: pure,
    unit: unit,
  });

export const identityFlatMap: Lazy<FlatMap<URI>> = () => ({
  ...identityFunctor(),
  ...identityApply(),
  flatMap: flatMap,
  flatTap: flatTap,
  flatten: flatten,
});

export const identityMonad: Lazy<Monad<URI>> = () => ({
  ...identityApplicative(),
  ...identityFlatMap(),
});
