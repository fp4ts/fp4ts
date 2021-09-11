import { Lazy, URI, V } from '../../../core';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';

import { IdentityURI } from './identity';
import { flatMap_, map_ } from './operators';
import { pure, unit } from './constructors';

export type Variance = V<'A', '+'>;

export const identityFunctor: Lazy<
  Functor<[URI<IdentityURI, Variance>], Variance>
> = () => Functor.of({ map_ });

export const identityApply: Lazy<
  Apply<[URI<IdentityURI, Variance>], Variance>
> = () =>
  Apply.of({
    ...identityFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  });

export const identityApplicative: Lazy<
  Applicative<[URI<IdentityURI, Variance>], Variance>
> = () =>
  Applicative.of({
    ...identityApply(),
    pure: pure,
    unit: () => unit,
  });

export const identityFlatMap: Lazy<
  FlatMap<[URI<IdentityURI, Variance>], Variance>
> = () => FlatMap.of({ ...identityApply(), flatMap_: flatMap_ });

export const identityMonad: Lazy<
  Monad<[URI<IdentityURI, Variance>], Variance>
> = () =>
  Monad.of({
    ...identityApplicative(),
    ...identityFlatMap(),
  });
