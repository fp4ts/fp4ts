// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, flow, HKT, HKT1, Kind } from '@fp4ts/core';
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

function of<F>(F: AsyncRequirements<F>): Async<F>;
function of<F>(F: AsyncRequirements<HKT1<F>>): Async<HKT1<F>> {
  const self: Async<HKT1<F>> = {
    async: <A>(
      k: (
        cb: (ea: Either<Error, A>) => void,
      ) => HKT<F, [Option<HKT<F, [void]>>]>,
    ): HKT<F, [A]> => {
      function body<G>(
        G: MonadCancel<G, Error>,
      ): (
        resume: (ea: Either<Error, A>) => void,
        get: Kind<G, [A]>,
        lift: FunctionK<HKT1<F>, G>,
      ) => Kind<G, [A]>;
      function body<G>(
        G: MonadCancel<HKT1<G>, Error>,
      ): (
        resume: (ea: Either<Error, A>) => void,
        get: HKT<G, [A]>,
        lift: FunctionK<HKT1<F>, HKT1<G>>,
      ) => HKT<G, [A]> {
        return (resume, get, lift) =>
          G.uncancelable(poll =>
            G.flatMap_(lift(k(resume)), opt =>
              opt.fold(
                () => poll(get),
                fin => G.onCancel_(poll(get), lift(fin)),
              ),
            ),
          );
      }

      return self.cont(body);
    },

    async_: <A>(k: (cb: (ea: Either<Error, A>) => void) => void): HKT<F, [A]> =>
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

    fromPromise: <A>(fp: HKT<F, [Promise<A>]>): HKT<F, [A]> =>
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
}

function asyncForKleisli<F, R>(F: Async<F>): Async<$<KleisliF, [F, R]>>;
function asyncForKleisli<F, R>(
  F: Async<HKT1<F>>,
): Async<$<KleisliF, [HKT1<F>, R]>> {
  return Async.of({
    ...Sync.syncForKleisli(F),
    ...Temporal.temporalForKleisli(F),

    readExecutionContext: Kleisli.liftF(F.readExecutionContext),

    executeOn_: <A>(
      fa: Kleisli<HKT1<F>, R, A>,
      ec: ExecutionContext,
    ): Kleisli<HKT1<F>, R, A> => Kleisli((r: R) => F.executeOn_(fa.run(r), ec)),

    cont: <K, R2>(
      body: Cont<$<KleisliF, [HKT1<F>, R]>, K, R2>,
    ): Kleisli<HKT1<F>, R, R2> =>
      Kleisli((r: R) => {
        function body_<G>(
          G: MonadCancel<G, Error>,
        ): (
          k: (ea: Either<Error, K>) => void,
          get: Kind<G, [K]>,
          nat: FunctionK<HKT1<F>, G>,
        ) => Kind<G, [R2]>;
        function body_<G>(
          G: MonadCancel<HKT1<G>, Error>,
        ): (
          k: (ea: Either<Error, K>) => void,
          get: HKT<G, [K]>,
          nat: FunctionK<HKT1<F>, HKT1<G>>,
        ) => HKT<G, [R2]> {
          return (k, get, nat) => {
            const natT = <A>(
              fa: Kleisli<HKT1<F>, R, A>,
            ): Kleisli<HKT1<G>, R, A> => Kleisli((r: R) => nat(fa.run(r)));

            return body(MonadCancel.forKleisli<HKT1<G>, R, Error>(G))(
              k,
              Kleisli.liftF(get),
              natT,
            ).run(r);
          };
        }

        const cont: Cont<HKT1<F>, K, R2> = body_;

        return F.cont(cont);
      }),
  });
}

function asyncForOptionT<F>(F: Async<F>): Async<$<OptionTF, [F]>>;
function asyncForOptionT<F>(F: Async<HKT1<F>>): Async<$<OptionTF, [HKT1<F>]>> {
  return Async.of({
    ...Sync.syncForOptionT(F),
    ...Temporal.temporalForOptionT(F),

    readExecutionContext: OptionT.liftF(F)(F.readExecutionContext),

    executeOn_: <A>(
      fa: OptionT<HKT1<F>, A>,
      ec: ExecutionContext,
    ): OptionT<HKT1<F>, A> => OptionT(F.executeOn_(fa.value, ec)),

    cont: <K, R>(
      body: Cont<$<OptionTF, [HKT1<F>]>, K, R>,
    ): OptionT<HKT1<F>, R> => {
      function body_<G>(
        G: MonadCancel<G, Error>,
      ): (
        k: (ea: Either<Error, K>) => void,
        get: Kind<G, [K]>,
        nat: FunctionK<HKT1<F>, G>,
      ) => Kind<G, [Option<R>]>;
      function body_<G>(
        G: MonadCancel<HKT1<G>, Error>,
      ): (
        k: (ea: Either<Error, K>) => void,
        get: HKT<G, [K]>,
        nat: FunctionK<HKT1<F>, HKT1<G>>,
      ) => HKT<G, [Option<R>]> {
        return (k, get, nat) => {
          const natT: FunctionK<
            $<OptionTF, [HKT1<F>]>,
            $<OptionTF, [HKT1<G>]>
          > = <A>(fa: OptionT<HKT1<F>, A>): OptionT<HKT1<G>, A> =>
            OptionT(nat(fa.value));

          return body(MonadCancel.forOptionT<HKT1<G>, Error>(G))(
            k,
            OptionT.liftF(G)(get),
            natT,
          ).value;
        };
      }

      const cont: Cont<HKT1<F>, K, Option<R>> = body_;

      return OptionT(F.cont(cont));
    },
  });
}

export const Async = Object.freeze({
  of,
  asyncForKleisli,
  asyncForOptionT,
});
