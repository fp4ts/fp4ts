// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $,
  $type,
  Base,
  cached,
  compose,
  Fix,
  id,
  Kind,
  Lazy,
  lazyVal,
  TyK,
  TyVar,
  α,
  λ,
} from '@fp4ts/core';
import { Defer } from '../defer';
import { SemigroupK } from '../semigroup-k';
import { MonoidK } from '../monoid-k';
import { Functor } from '../functor';
import { FunctorFilter } from '../functor-filter';
import { Apply } from '../apply';
import { Applicative } from '../applicative';
import { Alternative } from '../alternative';
import { ApplicativeError } from '../applicative-error';
import { FlatMap } from '../flat-map';
import { Monad } from '../monad';
import { MonadError } from '../monad-error';
import { Contravariant } from '../contravariant';
import { Arrow, ArrowApply, ArrowChoice, Compose } from '../arrow';
import { Distributive } from '../distributive';
import { Eval } from '../eval';
import { isStackSafeMonad } from '../stack-safe-monad';

import { AndThen } from './and-then';
import { Either, Left, Right } from './either';

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
  MonadError<F, A, E>(F: MonadError<F, E>): MonadError<$<KleisliF, [F, A]>, E>;

  Compose<F>(F: FlatMap<F>): Compose<$<KleisliF, [F]>>;
  Arrow<F>(F: Monad<F>): Arrow<$<KleisliF, [F]>>;
  ArrowApply<F>(F: Monad<F>): ArrowApply<$<KleisliF, [F]>>;
  ArrowChoice<F>(F: Monad<F>): ArrowChoice<$<KleisliF, [F]>>;
}

const suspend = <F, A, B>(
  F: Base<F>,
  f: (a: A) => Kind<F, [B]>,
): Kleisli<F, A, B> =>
  isStackSafeMonad(F) ? (a: A) => F.defer<B>(() => f(a)) : f;

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
    combineK_: <B>(x: Kleisli<F, A, B>, y: Lazy<Kleisli<F, A, B>>) =>
      suspend(F, (a: A) => F.combineK_<B>(x(a), () => y()(a))),
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
      combineK_: <B>(x: Kleisli<F, A, B>, y: Lazy<Kleisli<F, A, B>>) =>
        suspend(F, (a: A) => F.combineK_(x(a), () => y()(a))),

      emptyK: () => F.emptyK,
    }),
  ) as <F, A>(F: MonoidK<F>) => MonoidK<$<KleisliF, [F, A]>>;

const kleisliContravariant: <F, B>() => Contravariant<
  λ<KleisliF, [Fix<F>, α, Fix<B>]>
> = lazyVal(() =>
  Contravariant.of({ contramap_: (fa, f) => AndThen(f).andThen(fa) }),
);

const kleisliFunctor: <F, A>(F: Functor<F>) => Functor<$<KleisliF, [F, A]>> =
  cached(F => Functor.of({ map_: (fa, f) => AndThen(fa).andThen(F.map(f)) }));

const kleisliFunctorFilter: <F, A>(
  F: FunctorFilter<F>,
) => FunctorFilter<$<KleisliF, [F, A]>> = cached(F =>
  FunctorFilter.of({
    ...kleisliFunctor(F),
    mapFilter_: (fa, f) => AndThen(fa).andThen(F.mapFilter(f)),
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
  <F, R>(F: Apply<F>) =>
    Apply.of<$<KleisliF, [F, R]>>({
      ...kleisliFunctor(F),
      ap_: (ff, fa) => suspend(F, r => F.ap_(ff(r), fa(r))),
      map2_:
        <A, B>(fa: Kleisli<F, R, A>, fb: Kleisli<F, R, B>) =>
        <C>(f: (a: A, b: B) => C) =>
          suspend(F, (r: R) => F.map2_(fa(r), fb(r))(f)),
      map2Eval_:
        <A, B>(fa: Kleisli<F, R, A>, efb: Eval<Kleisli<F, R, B>>) =>
        <C>(f: (a: A, b: B) => C) =>
          Eval.now(
            suspend(
              F,
              (r: R) =>
                F.map2Eval_(
                  fa(r),
                  efb.map(fb => fb(r)),
                )(f).value,
            ),
          ),
    }),
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

const kleisliMonadError: <F, A, E>(
  F: MonadError<F, E>,
) => MonadError<$<KleisliF, [F, A]>, E> = cached(F =>
  MonadError.of({
    ...kleisliMonad(F),
    ...kleisliApplicativeError(F),
  }),
);

const kleisliCompose: <F>(F: FlatMap<F>) => Compose<$<KleisliF, [F]>> = cached(
  <F>(F: FlatMap<F>): Compose<$<KleisliF, [F]>> =>
    Compose.of({
      compose_: <A, B, C>(g: Kleisli<F, B, C>, f: Kleisli<F, A, B>) =>
        suspend(F, (a: A) => F.flatMap_(f(a), g)),
      andThen_: (f, g) => AndThen(f).andThen(F.flatMap(g)),
    }),
);

const kleisliArrow: <F>(F: Monad<F>) => Arrow<$<KleisliF, [F]>> = cached(
  <F>(F: Monad<F>): Arrow<$<KleisliF, [F]>> =>
    Arrow.of({
      lift:
        <A, B>(f: (a: A) => B) =>
        (a: A) =>
          F.pure(f(a)),
      first:
        <C>() =>
        <A, B>(k: Kleisli<F, A, B>) =>
        ([a, c]: [A, C]) =>
          F.map_(k(a), b => [b, c]),
      id:
        <A>() =>
        (a: A) =>
          F.pure(a),
      compose_: kleisliCompose(F).compose_,
      andThen_: kleisliCompose(F).andThen_,
    }),
);

const kleisliArrowApply: <F>(F: Monad<F>) => ArrowApply<$<KleisliF, [F]>> =
  cached(
    <F>(F: Monad<F>): ArrowApply<$<KleisliF, [F]>> =>
      ArrowApply.of<$<KleisliF, [F]>>({
        ...kleisliArrow(F),
        app:
          <A, B>() =>
          ([fab, a]: [Kleisli<F, A, B>, A]) =>
            fab(a),
      }),
  );

const kleisliArrowChoice: <F>(F: Monad<F>) => ArrowChoice<$<KleisliF, [F]>> =
  cached(
    <F>(F: Monad<F>): ArrowChoice<$<KleisliF, [F]>> =>
      ArrowChoice.of({
        ...kleisliArrow(F),
        choose: <A, B, C, D>(fac: Kleisli<F, A, C>, fbd: Kleisli<F, B, D>) =>
          suspend(
            F,
            (ab: Either<A, B>): Kind<F, [Either<C, D>]> =>
              ab.fold(compose(F.map(Left), fac), compose(F.map(Right), fbd)),
          ),
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
Kleisli.MonadError = kleisliMonadError;

Kleisli.Compose = kleisliCompose;
Kleisli.Arrow = kleisliArrow;
Kleisli.ArrowApply = kleisliArrowApply;
Kleisli.ArrowChoice = kleisliArrowChoice;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface KleisliF extends TyK<[unknown, unknown, unknown]> {
  [$type]: Kleisli<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
