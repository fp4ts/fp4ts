// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe } from '@fp4ts/core';
import { Option, Some, None, Either, Left, IdentityF } from '@fp4ts/cats';
import {
  Deferred,
  Ref,
  Outcome,
  Fiber,
  UniqueToken,
  Concurrent,
} from '@fp4ts/effect';

export type InterruptionOutcome = Outcome<IdentityF, Error, UniqueToken>;

export class InterruptContext<F> {
  private readonly __void!: void;

  private constructor(
    public readonly F: Concurrent<F, Error>,
    public readonly deferred: Deferred<F, InterruptionOutcome>,
    public readonly ref: Ref<F, Option<InterruptionOutcome>>,
    public readonly interruptRoot: UniqueToken,
    public readonly cancelParent: Kind<F, [void]>,
  ) {}

  public static create =
    <F>(F: Concurrent<F, Error>) =>
    (
      newScopeId: UniqueToken,
      cancelParent: Kind<F, [void]>,
    ): Kind<F, [InterruptContext<F>]> =>
      F.do(function* (_) {
        const deferred = yield* _(F.deferred<InterruptionOutcome>());
        const ref = yield* _(F.ref<Option<InterruptionOutcome>>(None));
        return new InterruptContext(F, deferred, ref, newScopeId, cancelParent);
      });

  public completeWhen(
    outcome: Kind<F, [InterruptionOutcome]>,
  ): Kind<F, [Fiber<F, Error, void>]> {
    const { F } = this;
    return F.fork(F.flatMap_(outcome, this.complete));
  }

  public childContext = (
    interruptible: boolean,
    newScopeId: UniqueToken,
  ): Kind<F, [InterruptContext<F>]> => {
    const { F, deferred } = this;

    if (!interruptible) return F.pure(this.copy({ cancelParent: F.unit }));

    return F.do(function* (_) {
      const fiber = yield* _(F.fork(deferred.get()));
      const context = yield* _(
        InterruptContext.create(F)(newScopeId, fiber.cancel),
      );
      yield* _(
        pipe(
          fiber.join,
          F.flatMap(oc =>
            oc.fold(
              () => context.complete(Outcome.canceled()),
              e => context.complete(Outcome.failure(e)),
              interrupt => F.flatMap_(interrupt, i => context.complete(i)),
            ),
          ),
          F.fork,
        ),
      );
      return context;
    });
  };

  public evalF<A>(fa: Kind<F, [A]>): Kind<F, [Either<InterruptionOutcome, A>]> {
    const { F, ref, deferred } = this;

    return pipe(
      ref.get(),
      F.flatMap(ocOpt =>
        ocOpt.fold<Kind<F, [Either<InterruptionOutcome, A>]>>(
          () =>
            F.map_(F.race_(deferred.get(), F.attempt(fa)), ear =>
              ear.fold(
                ioc => Left(ioc),
                result => result.leftMap(e => Outcome.failure(e)),
              ),
            ),
          oc => F.pure(Left(oc)),
        ),
      ),
    );
  }

  private complete = (outcome: InterruptionOutcome): Kind<F, [void]> => {
    const { F, ref, deferred } = this;

    return pipe(
      ref.update(oc => oc['<|>'](() => Some(outcome))),
      F.finalize(() => F.void(deferred.complete(outcome))),
    );
  };

  public copy({
    deferred = this.deferred,
    ref = this.ref,
    interruptRoot = this.interruptRoot,
    cancelParent = this.cancelParent,
  }: Partial<Props<F>> = {}): InterruptContext<F> {
    return new InterruptContext(
      this.F,
      deferred,
      ref,
      interruptRoot,
      cancelParent,
    );
  }
}

type Props<F> = {
  readonly deferred: Deferred<F, InterruptionOutcome>;
  readonly ref: Ref<F, Option<InterruptionOutcome>>;
  readonly interruptRoot: UniqueToken;
  readonly cancelParent: Kind<F, [void]>;
};
