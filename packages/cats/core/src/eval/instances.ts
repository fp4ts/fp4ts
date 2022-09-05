// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy, lazyVal } from '@fp4ts/core';
import { Eq, Semigroup, Monoid } from '@fp4ts/cats-kernel';
import { Defer } from '../defer';
import { Functor } from '../functor';
import { Apply } from '../apply';
import { Applicative } from '../applicative';
import { FlatMap } from '../flat-map';
import { CoflatMap } from '../coflat-map';
import { Monad } from '../monad';

import { Eval, EvalF } from './eval';
import { defer, pure } from './constructors';
import { flatMap_, map_, tailRecM_ } from './operators';
import { StackSafeMonad } from '../stack-safe-monad';

export const evalDefer: Lazy<Defer<EvalF>> = lazyVal(() => Defer.of({ defer }));

export const evalFunctor: Lazy<Functor<EvalF>> = lazyVal(() =>
  Functor.of({ map_: map_ }),
);

export const evalApply: Lazy<Apply<EvalF>> = lazyVal(() =>
  Apply.of({
    ...evalFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  }),
);

export const evalApplicative: Lazy<Applicative<EvalF>> = lazyVal(() =>
  Applicative.of({
    ...evalFunctor(),
    ...evalApply(),
    pure: pure,
  }),
);

export const evalFlatMap: Lazy<FlatMap<EvalF>> = lazyVal(() =>
  FlatMap.of({
    ...evalApply(),
    flatMap_: flatMap_,
    tailRecM_: tailRecM_,
  }),
);

export const evalCoflatMap: Lazy<CoflatMap<EvalF>> = lazyVal(() =>
  Applicative.coflatMap(evalApplicative()),
);

export const evalMonad: Lazy<Monad<EvalF>> = lazyVal(() =>
  StackSafeMonad.of({
    ...evalApplicative(),
    ...evalDefer(),
    ...evalFlatMap(),
  }),
);

interface EvalEq<A> extends Eq<Eval<A>> {}

export const evalEq: <A>(E: Eq<A>) => EvalEq<A> = E => Eq.by(E, e => e.value);

interface EvalSemigroup<A> extends Semigroup<Eval<A>> {}

export const evalSemigroup = <A>(A: Semigroup<A>): EvalSemigroup<A> =>
  Semigroup.of({
    combine_: (fx, fy) => map_(fx, x => A.combine_(x, () => fy().value)),
  });

interface EvalMonoid<A> extends Monoid<Eval<A>>, EvalSemigroup<A> {}

export const evalMonoid = <A>(M: Monoid<A>): EvalMonoid<A> =>
  Monoid.of({
    empty: Eval.later(() => M.empty),
    ...evalSemigroup(M),
  });
