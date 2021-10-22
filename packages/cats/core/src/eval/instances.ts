import { Lazy, lazyVal } from '@cats4ts/core';
import { Eq } from '../eq';
import { Semigroup } from '../semigroup';
import { Monoid } from '../monoid';
import { Defer } from '../defer';
import { Functor } from '../functor';
import { Apply } from '../apply';
import { Applicative } from '../applicative';
import { FlatMap } from '../flat-map';
import { Monad } from '../monad';

import { Eval, EvalK } from './eval';
import { defer, pure } from './constructors';
import { flatMap_, map_, tailRecM_ } from './operators';

export const evalDefer: Lazy<Defer<EvalK>> = lazyVal(() => Defer.of({ defer }));

export const evalFunctor: Lazy<Functor<EvalK>> = lazyVal(() =>
  Functor.of({ map_: map_ }),
);

export const evalApply: Lazy<Apply<EvalK>> = lazyVal(() =>
  Apply.of({
    ...evalFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  }),
);

export const evalApplicative: Lazy<Applicative<EvalK>> = lazyVal(() =>
  Applicative.of({
    ...evalFunctor(),
    ...evalApply(),
    pure: pure,
  }),
);

export const evalFlatMap: Lazy<FlatMap<EvalK>> = lazyVal(() =>
  FlatMap.of({
    ...evalApply(),
    flatMap_: flatMap_,
    tailRecM_: tailRecM_,
  }),
);

export const evalMonad: Lazy<Monad<EvalK>> = lazyVal(() =>
  Monad.of({
    ...evalApplicative(),
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
