// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, cached, Kind, TyK, TyVar } from '@fp4ts/core';
import {
  Either,
  EitherF,
  EitherT,
  EitherTF,
  Functor,
  Left,
  Monad,
  MonadError,
  Right,
} from '@fp4ts/cats';
import { ErrorF } from '@fp4ts/fused-core';
import { Algebra, Carrier, Eff, Handler } from '@fp4ts/fused-kernel';

/**
 * An EitherT carrier for the `Error` effect.
 */
export function EitherTAlgebra<E, Sig, F>(
  F: Algebra<Sig, F>,
): Algebra<{ error: $<ErrorF, [E]> } | Sig, $<EitherTF, [F, E]>> {
  return Algebra.withCarrier<$<ErrorF, [E]>, ErrorCF1<E>, 'error'>(
    new EitherTCarrier('error'),
  )(F);
}

class EitherTCarrier<E, N extends string> extends Carrier<
  $<ErrorF, [E]>,
  ErrorCF1<E>,
  N
> {
  public constructor(public readonly tag: N) {
    super();
  }

  monad<F>(F: Monad<F>): Monad<$<EitherTF, [F, E]>> {
    return EitherT.Monad(F);
  }

  eff<H, G, F, Sig, A>(
    F: Algebra<Sig, F>,
    H: Functor<H>,
    hdl: Handler<H, G, $<EitherTF, [F, E]>>,
    { eff }: Eff<Record<N, $<ErrorF, [E]>>, G, A>,
    hu: Kind<H, [void]>,
  ): Kind<F, [Either<E, Kind<H, [A]>>]> {
    const M = this.monadError(F);
    return eff.foldMap<[$<EitherTF, [F, E]>, H]>(
      <A>(e: E) => M.throwError<Kind<H, [A]>>(e),
      (ga, h) =>
        M.handleErrorWith_(hdl(H.map_(hu, () => ga)), e =>
          hdl(H.map_(hu, () => h(e))),
        ),
    );
  }

  other<H, G, F, Sig, A>(
    F: Algebra<Sig, F>,
    H: Functor<H>,
    hdl: Handler<H, G, $<EitherTF, [F, E]>>,
    eff: Eff<Sig, G, A>,
    hu: Kind<H, [void]>,
  ): Kind<F, [Either<E, Kind<H, [A]>>]> {
    return F.eff<[$<EitherF, [E]>, H], G, A, keyof Sig>(
      this.buildCtxFunctor(H),
      hx => hx.fold(e => F.pure(Left(e)), hdl),
      eff,
      Right<Kind<H, [void]>, E>(hu),
    );
  }

  private monadError<F>(F: Monad<F>): MonadError<$<EitherTF, [F, E]>, E> {
    return EitherT.MonadError(F);
  }

  private buildCtxFunctor = cached(<H>(H: Functor<H>) =>
    Functor.compose(Either.Monad<E>(), H),
  );
}

// -- HKT

export type ErrorCF = EitherTF;
export interface ErrorCF1<E> extends TyK<[unknown]> {
  [$type]: $<ErrorCF, [TyVar<this, 0>, E]>;
}
