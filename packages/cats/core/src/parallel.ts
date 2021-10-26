import { Base, instance, Kind } from '@fp4ts/core';
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
export const Parallel = Object.freeze({
  of: <M, F>(P: ParallelRequirements<M, F>): Parallel<M, F> =>
    instance<Parallel<M, F>>({
      applicativeError: E =>
        ApplicativeError.of({
          throwError: e => P.parallel(E.throwError(e)),
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
    }),

  parTraverse:
    <T, M, F>(T: Traversable<T>, P: Parallel<M, F>) =>
    <A, B>(f: (a: A) => Kind<M, [B]>) =>
    (ta: Kind<T, [A]>): Kind<[M, T], [B]> =>
      Parallel.parTraverse_(T, P)(ta, f),

  parTraverse_:
    <T, M, F>(T: Traversable<T>, P: Parallel<M, F>) =>
    <A, B>(ta: Kind<T, [A]>, f: (a: A) => Kind<M, [B]>): Kind<[M, T], [B]> => {
      const gtb = T.traverse_(P.applicative)(ta, a => P.parallel(f(a)));
      return P.sequential(gtb);
    },

  parSequence:
    <T, M, F>(T: Traversable<T>, P: Parallel<M, F>) =>
    <A>(tma: Kind<[T, M], [A]>): Kind<[M, T], [A]> => {
      const fta = T.traverse_(P.applicative)(tma, P.parallel);
      return P.sequential(fta);
    },

  identity: <M>(M: Monad<M>): Parallel<M, M> =>
    Parallel.of({
      monad: M,
      applicative: M,
      sequential: FunctionK.id(),
      parallel: FunctionK.id(),
    }),
});
