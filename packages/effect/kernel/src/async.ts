// Copyright (c) 2021 Peter Matta
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
  KleisliK,
  Kleisli,
  OptionTK,
  OptionT,
} from '@fp4ts/cats';

import { Cont } from './cont';
import { ExecutionContext } from './execution-context';
import { MonadCancel } from './monad-cancel';
import { Sync, SyncRequirements } from './sync';
import { Temporal, TemporalRequirements } from './temporal';

export interface Async<F> extends Sync<F>, Temporal<F, Error> {
  readonly async: <A>(
    k: (
      cb: (ea: Either<Error, A>) => void,
    ) => Kind<F, [Option<Kind<F, [void]>>]>,
  ) => Kind<F, [A]>;

  readonly async_: <A>(
    k: (cb: (ea: Either<Error, A>) => void) => void,
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

  readonly cont: <K, R>(body: Cont<F, K, R>) => Kind<F, [R]>;
}

export type AsyncRequirements<F> = Pick<
  Async<F>,
  'readExecutionContext' | 'executeOn_' | 'cont'
> &
  SyncRequirements<F> &
  TemporalRequirements<F, Error> &
  Partial<Async<F>>;
export const Async = Object.freeze({
  of: <F>(F: AsyncRequirements<F>): Async<F> => {
    const self: Async<F> = {
      async: <A>(
        k: (
          cb: (ea: Either<Error, A>) => void,
        ) => Kind<F, [Option<Kind<F, [void]>>]>,
      ): Kind<F, [A]> => {
        const body: Cont<F, A, A> =
          <G>(G: MonadCancel<G, Error>) =>
          (
            resume: (ea: Either<Error, A>) => void,
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

      async_: <A>(
        k: (cb: (ea: Either<Error, A>) => void) => void,
      ): Kind<F, [A]> =>
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
          self.async_(resume =>
            self.delay(() => {
              const onSuccess: (x: A) => void = flow(Right, resume);
              const onFailure: (e: Error) => void = flow(Left, resume);
              p.then(onSuccess, onFailure);
            }),
          ),
        ),

      ...Sync.of(F),
      ...Temporal.of(F),
      ...F,
    };
    return self;
  },

  asyncForKleisli: <F, R>(F: Async<F>): Async<$<KleisliK, [F, R]>> =>
    Async.of({
      ...Sync.syncForKleisli(F),
      ...Temporal.temporalForKleisli(F),

      readExecutionContext: Kleisli.liftF(F.readExecutionContext),

      executeOn_: <A>(
        fa: Kleisli<F, R, A>,
        ec: ExecutionContext,
      ): Kleisli<F, R, A> => Kleisli((r: R) => F.executeOn_(fa.run(r), ec)),

      cont: <K, R2>(
        body: Cont<$<KleisliK, [F, R]>, K, R2>,
      ): Kleisli<F, R, R2> =>
        Kleisli((r: R) => {
          const cont: Cont<F, K, R2> =
            <G>(G: MonadCancel<G, Error>) =>
            (
              k: (ea: Either<Error, K>) => void,
              get: Kind<G, [K]>,
              nat: FunctionK<F, G>,
            ): Kind<G, [R2]> => {
              const natT = <A>(fa: Kleisli<F, R, A>): Kleisli<G, R, A> =>
                Kleisli((r: R) => nat(fa.run(r)));

              return body(MonadCancel.forKleisli<G, R, Error>(G))(
                k,
                Kleisli.liftF(get),
                natT,
              ).run(r);
            };

          return F.cont(cont);
        }),
    }),

  asyncForOptionT: <F>(F: Async<F>): Async<$<OptionTK, [F]>> =>
    Async.of({
      ...Sync.syncForOptionT(F),
      ...Temporal.temporalForOptionT(F),

      readExecutionContext: OptionT.liftF(F)(F.readExecutionContext),

      executeOn_: <A>(fa: OptionT<F, A>, ec: ExecutionContext): OptionT<F, A> =>
        OptionT(F.executeOn_(fa.value, ec)),

      cont: <K, R>(body: Cont<$<OptionTK, [F]>, K, R>): OptionT<F, R> => {
        const cont: Cont<F, K, Option<R>> =
          <G>(G: MonadCancel<G, Error>) =>
          (
            k: (ea: Either<Error, K>) => void,
            get: Kind<G, [K]>,
            nat: FunctionK<F, G>,
          ): Kind<G, [Option<R>]> => {
            const natT: FunctionK<$<OptionTK, [F]>, $<OptionTK, [G]>> = <A>(
              fa: OptionT<F, A>,
            ): OptionT<G, A> => OptionT(nat(fa.value));

            return body(MonadCancel.forOptionT<G, Error>(G))(
              k,
              OptionT.liftF(G)(get),
              natT,
            ).value;
          };

        return OptionT(F.cont(cont));
      },
    }),
});
