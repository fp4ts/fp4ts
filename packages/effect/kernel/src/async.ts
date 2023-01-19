// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, flow, Kind } from '@fp4ts/core';
import {
  FunctionK,
  Either,
  Right,
  Left,
  Option,
  None,
  KleisliF,
  Kleisli,
  OptionTF,
  OptionT,
} from '@fp4ts/cats';

import { Cont } from './cont';
import { ExecutionContext } from './execution-context';
import { MonadCancel } from './monad-cancel';
import { Sync, SyncRequirements } from './sync';
import { Temporal, TemporalRequirements } from './temporal';

export interface Async<F, E = Error> extends Sync<F, E>, Temporal<F, E> {
  readonly async: <A>(
    k: (cb: (ea: Either<E, A>) => void) => Kind<F, [Option<Kind<F, [void]>>]>,
  ) => Kind<F, [A]>;

  readonly async_: <A>(
    k: (cb: (ea: Either<E, A>) => void) => void,
  ) => Kind<F, [A]>;

  readonly never: Kind<F, [never]>;

  readonly readExecutionContext: Kind<F, [ExecutionContext]>;

  readonly executeOn: (
    ec: ExecutionContext,
  ) => <A>(fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly executeOn_: <A>(
    fa: Kind<F, [A]>,
    ec: ExecutionContext,
  ) => Kind<F, [A]>;

  readonly fromPromise: <A>(p: Kind<F, [Promise<A>]>) => Kind<F, [A]>;

  readonly cont: <K, R>(body: Cont<F, K, R, E>) => Kind<F, [R]>;
}

export type AsyncRequirements<F, E = Error> = Pick<
  Async<F, E>,
  'readExecutionContext' | 'executeOn_' | 'cont'
> &
  SyncRequirements<F, E> &
  TemporalRequirements<F, E> &
  Partial<Async<F, E>>;
export const Async = Object.freeze({
  of: <F, E = Error>(F: AsyncRequirements<F, E>): Async<F, E> => {
    const self: Async<F, E> = {
      async: <A>(
        k: (
          cb: (ea: Either<E, A>) => void,
        ) => Kind<F, [Option<Kind<F, [void]>>]>,
      ): Kind<F, [A]> => {
        const body: Cont<F, A, A, E> =
          <G>(G: MonadCancel<G, E>) =>
          (
            resume: (ea: Either<E, A>) => void,
            get: Kind<G, [A]>,
            lift: FunctionK<F, G>,
          ) =>
            G.uncancelable(poll =>
              G.flatMap_(lift(k(resume)), opt =>
                opt.fold(
                  () => poll(get),
                  fin => G.onCancel_(poll(get), lift(fin)),
                ),
              ),
            );

        return self.cont(body);
      },

      async_: <A>(k: (cb: (ea: Either<E, A>) => void) => void): Kind<F, [A]> =>
        self.async<A>(cb =>
          self.map_(
            self.delay(() => k(cb)),
            () => None,
          ),
        ),

      get never() {
        return self.async(() => self.pure(None));
      },

      executeOn: ec => fa => self.executeOn_(fa, ec),

      fromPromise: <A>(fp: Kind<F, [Promise<A>]>): Kind<F, [A]> =>
        self.flatMap_(fp, p =>
          self.async_(resume => {
            const onSuccess: (x: A) => void = flow(Right, resume);
            const onFailure: (e: E) => void = flow(Left, resume);
            p.then(onSuccess, onFailure);
          }),
        ),

      ...Sync.of(F),
      ...Temporal.of(F),
      ...F,
    };
    return self;
  },

  asyncForKleisli: <F, R, E>(F: Async<F, E>): Async<$<KleisliF, [F, R]>, E> =>
    Async.of<$<KleisliF, [F, R]>, E>({
      ...Sync.syncForKleisli<F, R, E>(F),
      ...Temporal.temporalForKleisli(F),

      readExecutionContext: () => F.readExecutionContext,

      executeOn_: <A>(
        fa: Kleisli<F, R, A>,
        ec: ExecutionContext,
      ): Kleisli<F, R, A> => Kleisli((r: R) => F.executeOn_(fa(r), ec)),

      cont: <K, R2>(
        body: Cont<$<KleisliF, [F, R]>, K, R2, E>,
      ): Kleisli<F, R, R2> =>
        Kleisli((r: R) => {
          const cont: Cont<F, K, R2, E> =
            <G>(G: MonadCancel<G, E>) =>
            (
              k: (ea: Either<E, K>) => void,
              get: Kind<G, [K]>,
              nat: FunctionK<F, G>,
            ): Kind<G, [R2]> => {
              const natT = <A>(fa: Kleisli<F, R, A>): Kleisli<G, R, A> =>
                Kleisli((r: R) => nat(fa(r)));

              return body(MonadCancel.forKleisli<G, R, E>(G))(
                k,
                () => get,
                natT,
              )(r);
            };

          return F.cont(cont);
        }),
    }),

  asyncForOptionT: <F, E>(F: Async<F, E>): Async<$<OptionTF, [F]>, E> =>
    Async.of<$<OptionTF, [F]>, E>({
      ...Sync.syncForOptionT<F, E>(F),
      ...Temporal.temporalForOptionT(F),

      readExecutionContext: OptionT.liftF(F)(F.readExecutionContext),

      executeOn_: <A>(fa: OptionT<F, A>, ec: ExecutionContext): OptionT<F, A> =>
        OptionT(F.executeOn_(fa, ec)),

      cont: <K, R>(body: Cont<$<OptionTF, [F]>, K, R, E>): OptionT<F, R> => {
        const cont: Cont<F, K, Option<R>, E> =
          <G>(G: MonadCancel<G, E>) =>
          (
            k: (ea: Either<E, K>) => void,
            get: Kind<G, [K]>,
            nat: FunctionK<F, G>,
          ): Kind<G, [Option<R>]> => {
            const natT: FunctionK<$<OptionTF, [F]>, $<OptionTF, [G]>> = <A>(
              fa: OptionT<F, A>,
            ): OptionT<G, A> => nat(fa);

            return body(MonadCancel.forOptionT<G, E>(G))(
              k,
              OptionT.liftF(G)(get),
              natT,
            );
          };

        return OptionT(F.cont(cont));
      },
    }),
});
