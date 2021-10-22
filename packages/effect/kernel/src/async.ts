import { flow, Kind } from '@cats4ts/core';
import { FunctionK, Either, Right, Left, Option, None } from '@cats4ts/cats';

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
});
