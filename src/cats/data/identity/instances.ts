import { Lazy } from '../../../core';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';

import { IdentityK } from './identity';
import { flatMap_, map_ } from './operators';
import { pure, unit } from './constructors';

export const identityFunctor: Lazy<Functor<IdentityK>> = () =>
  Functor.of({ map_ });

export const identityApply: Lazy<Apply<IdentityK>> = () =>
  Apply.of({
    ...identityFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  });

export const identityApplicative: Lazy<Applicative<IdentityK>> = () =>
  Applicative.of({
    ...identityApply(),
    pure: pure,
    unit: unit,
  });

export const identityFlatMap: Lazy<FlatMap<IdentityK>> = () =>
  FlatMap.of({ ...identityApply(), flatMap_: flatMap_ });

export const identityMonad: Lazy<Monad<IdentityK>> = () =>
  Monad.of({
    ...identityApplicative(),
    ...identityFlatMap(),
  });
