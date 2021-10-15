import { Kind, Lazy } from '@cats4ts/core';
import { Eval } from '../../eval';
import { Functor } from '../../functor';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';
import { Foldable } from '../../foldable';
import { Traversable } from '../../traversable';

import { IdentityK } from './identity';
import { flatMap_, map_, tailRecM_ } from './operators';
import { pure, unit } from './constructors';
import { Identity } from './identity';

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
  FlatMap.of({ ...identityApply(), flatMap_: flatMap_, tailRecM_: tailRecM_ });

export const identityMonad: Lazy<Monad<IdentityK>> = () =>
  Monad.of({
    ...identityApplicative(),
    ...identityFlatMap(),
  });

export const identityFoldable: Lazy<Foldable<IdentityK>> = () =>
  Foldable.of({
    foldLeft_: (fa, b, f) => f(b, fa),
    foldRight_: (fa, eb, f) => Eval.defer(() => f(fa, eb)),
  });

export const identityTraversable: Lazy<Traversable<IdentityK>> = () =>
  Traversable.of({
    ...identityFoldable(),
    ...identityFunctor(),
    traverse_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: Identity<A>, f: (a: A) => Kind<G, [B]>) =>
        f(fa),
  });
