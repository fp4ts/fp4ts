import { $, AnyK, _, α, λ } from '@cats4ts/core';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Contravariant } from '../../contravariant';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Alternative } from '../../alternative';
import { ApplicativeError } from '../../applicative-error';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';
import { MonadError } from '../../monad-error';

import { Kleisli, KleisliK } from './kleisli';
import {
  adapt_,
  ap_,
  flatMap_,
  map2_,
  map_,
  productL_,
  productR_,
  product_,
  tailRecM_,
} from './operators';
import { liftF, pure, suspend } from './constructors';

export const kleisliSemigroupK: <F extends AnyK, A>(
  F: SemigroupK<F>,
) => SemigroupK<$<KleisliK, [F, A]>> = <F extends AnyK, A>(F: SemigroupK<F>) =>
  SemigroupK.of<$<KleisliK, [F, A]>>({
    combineK_: <B>(x: Kleisli<F, A, B>, y: () => Kleisli<F, A, B>) =>
      suspend((a: A) => F.combineK_<B>(x.run(a), () => y().run(a))),
  });

export const kleisliMonoidK: <F extends AnyK, A>(
  F: MonoidK<F>,
) => MonoidK<$<KleisliK, [F, A]>> = <F extends AnyK, A>(F: MonoidK<F>) =>
  MonoidK.of<$<KleisliK, [F, A]>>({
    combineK_: <B>(x: Kleisli<F, A, B>, y: () => Kleisli<F, A, B>) =>
      suspend((a: A) => F.combineK_<B>(x.run(a), () => y().run(a))),

    emptyK: () => liftF(F.emptyK()),
  });

export const kleisliContravariant: <F extends AnyK, B>() => Contravariant<
  λ<[α], $<KleisliK, [F, α, B]>>
> = () =>
  Contravariant.of({
    contramap_: (fa, f) => adapt_(fa, f) as any,
  });

export const kleisliFunctor: <F extends AnyK, A>(
  F: Functor<F>,
) => Functor<$<KleisliK, [F, A]>> = F =>
  Functor.of({
    map_: map_(F),
  });

export const kleisliFunctorFilter: <F extends AnyK, A>(
  F: FunctorFilter<F>,
) => FunctorFilter<$<KleisliK, [F, A]>> = F =>
  FunctorFilter.of({
    ...kleisliFunctor(F),
    mapFilter_: (fa, f) => suspend(a => F.mapFilter_(fa.run(a), f)),
  });

export const kleisliApply: <F extends AnyK, A>(
  F: Apply<F>,
) => Apply<$<KleisliK, [F, A]>> = F =>
  Apply.of({
    ...kleisliFunctor(F),
    ap_: ap_(F),
    map2_: map2_(F),
    product_: product_(F),
    productL_: productL_(F),
    productR_: productR_(F),
  });

export const kleisliApplicative: <F extends AnyK, A>(
  F: Applicative<F>,
) => Applicative<$<KleisliK, [F, A]>> = F =>
  Applicative.of({
    ...kleisliFunctor(F),
    ...kleisliApply(F),
    pure: pure(F),
  });

export const kleisliAlternative: <F extends AnyK, A>(
  F: Alternative<F>,
) => Alternative<$<KleisliK, [F, A]>> = F =>
  Alternative.of({
    ...kleisliMonoidK(F),
    ...kleisliApplicative(F),
  });

export const kleisliApplicativeError: <F extends AnyK, A, E>(
  F: ApplicativeError<F, E>,
) => ApplicativeError<$<KleisliK, [F, A]>, E> = <F extends AnyK, A, E>(
  F: ApplicativeError<F, E>,
) =>
  ApplicativeError.of<$<KleisliK, [F, A]>, E>({
    ...kleisliApplicative(F),
    throwError: <B>(e: E) => liftF(F.throwError<B>(e)),
    handleErrorWith_: (fa, f) =>
      suspend((a: A) => F.handleErrorWith_(fa.run(a), e => f(e).run(a))),
  });

export const kleisliFlatMap: <F extends AnyK, A>(
  F: Monad<F>,
) => FlatMap<$<KleisliK, [F, A]>> = F =>
  FlatMap.of({
    ...kleisliApply(F),
    flatMap_: flatMap_(F),
    tailRecM_: tailRecM_(F),
  });

export const kleisliMonad: <F extends AnyK, A>(
  F: Monad<F>,
) => Monad<$<KleisliK, [F, A]>> = F =>
  Monad.of({
    ...kleisliApplicative(F),
    ...kleisliFlatMap(F),
  });

export const kleisliMonadError: <F extends AnyK, A, E>(
  F: MonadError<F, E>,
) => MonadError<$<KleisliK, [F, A]>, E> = F =>
  MonadError.of({
    ...kleisliMonad(F),
    ...kleisliApplicativeError(F),
  });
