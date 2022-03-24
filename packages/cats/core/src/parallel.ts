// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, HKT, HKT1, instance, Kind } from '@fp4ts/core';
import { FunctionK } from './arrow';
import { Applicative } from './applicative';
import { Monad } from './monad';
import { Traversable } from './traversable';
import { ApplicativeError } from './applicative-error';
import { MonadError } from './monad-error';

/**
 * @category Type Class
 */
export interface Parallel<M, F> extends Base<M> {
  readonly applicative: Applicative<F>;

  readonly monad: Monad<M>;

  readonly sequential: FunctionK<F, M>;

  readonly parallel: FunctionK<M, F>;

  readonly applicativeError: <E>(E: MonadError<M, E>) => ApplicativeError<F, E>;
}

export type ParallelRequirements<M, F> = Pick<
  Parallel<M, F>,
  'applicative' | 'monad' | 'sequential' | 'parallel'
>;

function of<M, F>(P: ParallelRequirements<M, F>): Parallel<M, F>;
function of<M, F>(
  P: ParallelRequirements<HKT1<M>, HKT1<F>>,
): Parallel<HKT1<M>, HKT1<F>> {
  return instance<Parallel<HKT1<M>, HKT1<F>>>({
    applicativeError: <E>(E: MonadError<HKT1<M>, E>) =>
      ApplicativeError.of({
        throwError: <A>(e: E) => P.parallel(E.throwError<A>(e)),
        handleErrorWith_: (fa, h) => {
          const x = E.handleErrorWith_(P.sequential(fa), e =>
            P.sequential(h(e)),
          );
          return P.parallel(x);
        },
        pure: P.applicative.pure,
        ap_: P.applicative.ap_,
        map_: P.applicative.map_,
        product_: P.applicative.product_,
        map2_: P.applicative.map2_,
        map2Eval_: P.applicative.map2Eval_,
      }),
    ...P,
  });
}

function parTraverse<T, M, F>(
  T: Traversable<T>,
  P: Parallel<M, F>,
): <A, B>(f: (a: A) => Kind<M, [B]>) => (ta: Kind<T, [A]>) => Kind<[M, T], [B]>;
function parTraverse<T, M, F>(
  T: Traversable<HKT1<T>>,
  P: Parallel<HKT1<M>, HKT1<F>>,
): <A, B>(
  f: (a: A) => HKT<M, [B]>,
) => (ta: HKT<T, [A]>) => HKT<M, [HKT<T, [B]>]> {
  return f => ta => Parallel.parTraverse_(T, P)(ta, f);
}

function parTraverse_<T, M, F>(
  T: Traversable<T>,
  P: Parallel<M, F>,
): <A, B>(ta: Kind<T, [A]>, f: (a: A) => Kind<M, [B]>) => Kind<[M, T], [B]>;
function parTraverse_<T, M, F>(
  T: Traversable<HKT1<T>>,
  P: Parallel<HKT1<M>, HKT1<F>>,
): <A, B>(ta: HKT<T, [A]>, f: (a: A) => HKT<M, [B]>) => HKT<M, [HKT<T, [B]>]> {
  return (ta, f) => {
    const gtb = T.traverse_(P.applicative)(ta, a => P.parallel(f(a)));
    return P.sequential(gtb);
  };
}

function parSequence<T, M, F>(
  T: Traversable<T>,
  P: Parallel<M, F>,
): <A>(tma: Kind<[T, M], [A]>) => Kind<[M, T], [A]>;
function parSequence<T, M, F>(
  T: Traversable<HKT1<T>>,
  P: Parallel<HKT1<M>, HKT1<F>>,
): <A>(tma: HKT<T, [HKT<M, [A]>]>) => HKT<M, [HKT<T, [A]>]> {
  return tma => {
    const fta = T.traverse_(P.applicative)(tma, P.parallel);
    return P.sequential(fta);
  };
}

function identity<M>(M: Monad<M>): Parallel<M, M>;
function identity<M>(M: Monad<HKT1<M>>): Parallel<HKT1<M>, HKT1<M>> {
  return Parallel.of<HKT1<M>, HKT1<M>>({
    monad: M,
    applicative: M,
    sequential: FunctionK.id(),
    parallel: FunctionK.id(),
  });
}

export const Parallel = Object.freeze({
  of,

  parTraverse,
  parTraverse_,
  parSequence,

  identity,
});
