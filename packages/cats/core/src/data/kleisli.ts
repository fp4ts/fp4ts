// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $,
  $type,
  Base,
  cached,
  Eval,
  EvalF,
  F1,
  Fix,
  Kind,
  Lazy,
  lazy,
  TyK,
  TyVar,
  α,
  λ,
} from '@fp4ts/core';
import { Defer, isDefer } from '../defer';
import { SemigroupK } from '../semigroup-k';
import { MonoidK } from '../monoid-k';
import { Functor } from '../functor';
import { FunctorFilter } from '../functor-filter';
import { Apply, TraverseStrategy } from '../apply';
import { Applicative } from '../applicative';
import { Alternative } from '../alternative';
import { ApplicativeError } from '../applicative-error';
import { FlatMap } from '../flat-map';
import { Monad } from '../monad';
import { MonadError } from '../monad-error';
import { Contravariant } from '../contravariant';
import { Distributive } from '../distributive';
import { MonadDefer } from '../monad-defer';
import { MonadPlus } from '../monad-plus';

export type Kleisli<F, A, B> = (a: A) => Kind<F, [B]>;

export const Kleisli: KleisliObj = function (f) {
  return f;
};

export interface KleisliObj {
  <F, A, B>(f: (a: A) => Kind<F, [B]>): Kleisli<F, A, B>;

  // -- Instances
  Defer<F, A>(F: Defer<F>): Defer<$<KleisliF, [F, A]>>;
  SemigroupK<F, A>(F: SemigroupK<F>): SemigroupK<$<KleisliF, [F, A]>>;
  MonoidK<F, A>(F: MonoidK<F>): MonoidK<$<KleisliF, [F, A]>>;
  Distributive<F, R>(F: Distributive<F>): Distributive<$<KleisliF, [F, R]>>;
  Contravariant<F, B>(): Contravariant<λ<KleisliF, [Fix<F>, α, Fix<B>]>>;
  Functor<F, A>(F: Functor<F>): Functor<$<KleisliF, [F, A]>>;
  FunctorFilter<F, A>(F: FunctorFilter<F>): FunctorFilter<$<KleisliF, [F, A]>>;
  Apply<F, A>(F: FlatMap<F>): Apply<$<KleisliF, [F, A]>>;
  Applicative<F, A>(F: Applicative<F>): Applicative<$<KleisliF, [F, A]>>;
  Alternative<F, A>(F: Alternative<F>): Alternative<$<KleisliF, [F, A]>>;
  ApplicativeError<F, A, E>(
    F: ApplicativeError<F, E>,
  ): ApplicativeError<$<KleisliF, [F, A]>, E>;
  FlatMap<F, A>(F: FlatMap<F>): FlatMap<$<KleisliF, [F, A]>>;
  Monad<F, A>(F: Monad<F>): Monad<$<KleisliF, [F, A]>>;
  MonadPlus<F, A>(F: MonadPlus<F>): MonadPlus<$<KleisliF, [F, A]>>;
  MonadDefer<F, A>(F: MonadDefer<F>): MonadDefer<$<KleisliF, [F, A]>>;
  MonadError<F, A, E>(F: MonadError<F, E>): MonadError<$<KleisliF, [F, A]>, E>;
}

const suspend = <F, A, B>(
  F: Base<F>,
  f: (a: A) => Kind<F, [B]>,
): Kleisli<F, A, B> => (isDefer(F) ? (a: A) => F.defer<B>(() => f(a)) : f);

const kleisliDefer: <F, R>(F: Defer<F>) => Defer<$<KleisliF, [F, R]>> = cached(
  <F, R>(F: Defer<F>) =>
    Defer.of<$<KleisliF, [F, R]>>({
      defer:
        <A>(fa: Lazy<Kleisli<F, R, A>>) =>
        (r: R) =>
          F.defer(() => fa()(r)),
    }),
) as <F, R>(F: Defer<F>) => Defer<$<KleisliF, [F, R]>>;

const kleisliSemigroupK: <F, A>(
  F: SemigroupK<F>,
) => SemigroupK<$<KleisliF, [F, A]>> = cached(<F, A>(F: SemigroupK<F>) =>
  SemigroupK.of<$<KleisliF, [F, A]>>({
    combineK_: <B>(x: Kleisli<F, A, B>, y: Kleisli<F, A, B>) =>
      F1.flatMap(x, x => F1.andThen(y, y => F.combineK_(x, y))),
    combineKEval_: <B>(x: Kleisli<F, A, B>, ey: Eval<Kleisli<F, A, B>>) =>
      Eval.now(
        suspend(
          F,
          (a: A) =>
            F.combineKEval_(
              x(a),
              ey.map(y => y(a)),
            ).value,
        ),
      ),
  }),
) as <F, A>(F: SemigroupK<F>) => SemigroupK<$<KleisliF, [F, A]>>;

const kleisliMonoidK: <F, A>(F: MonoidK<F>) => MonoidK<$<KleisliF, [F, A]>> =
  cached(<F, A>(F: MonoidK<F>) =>
    MonoidK.of<$<KleisliF, [F, A]>>({
      combineK_: <B>(x: Kleisli<F, A, B>, y: Kleisli<F, A, B>) =>
        F1.flatMap(x, x => F1.andThen(y, y => F.combineK_(x, y))),

      combineKEval_: <B>(x: Kleisli<F, A, B>, ey: Eval<Kleisli<F, A, B>>) =>
        Eval.now(
          suspend(
            F,
            (a: A) =>
              F.combineKEval_(
                x(a),
                ey.map(y => y(a)),
              ).value,
          ),
        ),

      emptyK: () => F.emptyK,
    }),
  ) as <F, A>(F: MonoidK<F>) => MonoidK<$<KleisliF, [F, A]>>;

const kleisliContravariant: <F, B>() => Contravariant<
  λ<KleisliF, [Fix<F>, α, Fix<B>]>
> = lazy(() => Contravariant.of({ contramap_: F1.compose }));

const kleisliFunctor: <F, A>(F: Functor<F>) => Functor<$<KleisliF, [F, A]>> =
  cached(F => Functor.of({ map_: (fa, f) => F1.andThen(fa, F.map(f)) }));

const kleisliFunctorFilter: <F, A>(
  F: FunctorFilter<F>,
) => FunctorFilter<$<KleisliF, [F, A]>> = cached(F =>
  FunctorFilter.of({
    ...kleisliFunctor(F),
    mapFilter_: (fa, f) => F1.andThen(fa, F.mapFilter(f)),
  }),
);

const kleisliDistributive = <F, R>(
  F: Distributive<F>,
): Distributive<$<KleisliF, [F, R]>> =>
  Distributive.of({
    ...kleisliFunctor(F),

    distribute_:
      <G>(G: Functor<G>) =>
      <A, B>(ga: Kind<G, [A]>, f: (a: A) => Kleisli<F, R, B>) =>
      (r: R) =>
        F.distribute_(G)(ga, (a: A) => f(a)(r)),
  });

const kleisliApply: <F, R>(F: Apply<F>) => Apply<$<KleisliF, [F, R]>> = cached(
  <F, R>(F: Apply<F>) => {
    const self: Apply<$<KleisliF, [F, R]>> = Apply.of<$<KleisliF, [F, R]>>({
      ...kleisliFunctor(F),
      ap_: (ff, fa) => F1.flatMap(ff, f => F1.andThen(fa, a => F.ap_(f, a))),
      map2_: <A, B, C>(
        fa: Kleisli<F, R, A>,
        fb: Kleisli<F, R, B>,
        f: (a: A, b: B) => C,
      ) => F1.flatMap(fa, a => F1.andThen(fb, b => F.map2_(a, b, f))),
      map2Eval_: <A, B, C>(
        fa: Kleisli<F, R, A>,
        efb: Eval<Kleisli<F, R, B>>,
        f: (a: A, b: B) => C,
      ) =>
        Eval.now(
          suspend(
            F,
            (r: R) =>
              F.map2Eval_(
                fa(r),
                efb.map(fb => fb(r)),
                f,
              ).value,
          ),
        ),
    });

    if (!isDefer(F)) {
      const ts: TraverseStrategy<
        $<KleisliF, [F, R]>,
        $<KleisliF, [[EvalF, F], R]>
      > = {
        defer: F1.defer,
        map: (fa, f) => (r: R) => Eval.defer(() => fa(r).map(F.map(f))),
        map2: (fa, fb, f) => (r: R) =>
          Eval.defer(() =>
            fa(r).flatMap(fa =>
              F.map2Eval_(
                fa,
                Eval.defer(() => fb(r)),
                f,
              ),
            ),
          ),
        map2Rhs: (fa, fb, f) => (r: R) =>
          Eval.defer(() =>
            F.map2Eval_(
              fa(r),
              Eval.defer(() => fb(r)),
              f,
            ),
          ),
        toG: fa => F1.andThen(fa, efa => efa.value),
        toRhs: thunk => (r: R) => Eval.later(() => thunk()(r)),
      };
      self.TraverseStrategy = use => use(ts);
    }
    return self;
  },
) as <F, R>(F: Apply<F>) => Apply<$<KleisliF, [F, R]>>;

const kleisliApplicative: <F, A>(
  F: Applicative<F>,
) => Applicative<$<KleisliF, [F, A]>> = cached(F =>
  Applicative.of({
    ...kleisliFunctor(F),
    ...kleisliApply(F),
    pure:
      <A>(x: A) =>
      () =>
        F.pure(x),
  }),
);

const kleisliAlternative: <F, A>(
  F: Alternative<F>,
) => Alternative<$<KleisliF, [F, A]>> = cached(F =>
  Alternative.of({
    ...kleisliMonoidK(F),
    ...kleisliApplicative(F),
  }),
);

const kleisliApplicativeError: <F, A, E>(
  F: ApplicativeError<F, E>,
) => ApplicativeError<$<KleisliF, [F, A]>, E> = cached(
  <F, A, E>(F: ApplicativeError<F, E>) =>
    ApplicativeError.of<$<KleisliF, [F, A]>, E>({
      ...kleisliApplicative(F),
      throwError:
        <B>(e: E) =>
        () =>
          F.throwError<B>(e),
      handleErrorWith_: (fa, f) =>
        suspend(F, (a: A) => F.handleErrorWith_(fa(a), e => f(e)(a))),
    }),
) as <F, A, E>(
  F: ApplicativeError<F, E>,
) => ApplicativeError<$<KleisliF, [F, A]>, E>;

const kleisliFlatMap: <F, A>(F: FlatMap<F>) => FlatMap<$<KleisliF, [F, A]>> =
  cached(F =>
    FlatMap.of({
      ...kleisliApply(F),
      flatMap_: (fa, f) => suspend(F, r => F.flatMap_(fa(r), a => f(a)(r))),
      tailRecM_: (a, f) => suspend(F, r => F.tailRecM_(a, x => f(x)(r))),
    }),
  );

const kleisliMonad: <F, A>(F: Monad<F>) => Monad<$<KleisliF, [F, A]>> = cached(
  F =>
    Monad.of({
      ...kleisliApplicative(F),
      ...kleisliFlatMap(F),
    }),
);
const kleisliMonadPlus: <F, A>(
  F: MonadPlus<F>,
) => MonadPlus<$<KleisliF, [F, A]>> = cached(F =>
  MonadPlus.of({
    ...kleisliAlternative(F),
    ...kleisliFunctor(F),
    ...kleisliMonad(F),
  }),
);
const kleisliMonadDefer: <F, A>(
  F: MonadDefer<F>,
) => MonadDefer<$<KleisliF, [F, A]>> = cached(F =>
  MonadDefer.of({
    ...kleisliDefer(F),
    ...kleisliMonad(F),
  }),
);

const kleisliMonadError: <F, A, E>(
  F: MonadError<F, E>,
) => MonadError<$<KleisliF, [F, A]>, E> = cached(F =>
  MonadError.of({
    ...kleisliMonad(F),
    ...kleisliApplicativeError(F),
  }),
);

Kleisli.Defer = kleisliDefer;
Kleisli.SemigroupK = kleisliSemigroupK;
Kleisli.MonoidK = kleisliMonoidK;
Kleisli.Distributive = kleisliDistributive;
Kleisli.Functor = kleisliFunctor;
Kleisli.FunctorFilter = kleisliFunctorFilter;
Kleisli.Contravariant = kleisliContravariant;
Kleisli.Apply = kleisliApply;
Kleisli.Applicative = kleisliApplicative;
Kleisli.Alternative = kleisliAlternative;
Kleisli.ApplicativeError = kleisliApplicativeError;
Kleisli.FlatMap = kleisliFlatMap;
Kleisli.Monad = kleisliMonad;
Kleisli.MonadDefer = kleisliMonadDefer;
Kleisli.MonadPlus = kleisliMonadPlus;
Kleisli.MonadError = kleisliMonadError;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface KleisliF extends TyK<[unknown, unknown, unknown]> {
  [$type]: Kleisli<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
