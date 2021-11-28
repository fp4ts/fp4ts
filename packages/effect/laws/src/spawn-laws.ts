// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind, pipe } from '@fp4ts/core';
import { Either, Right, Left } from '@fp4ts/cats';
import { Spawn, Outcome } from '@fp4ts/effect-kernel';
import { IsEq } from '@fp4ts/cats-test-kit';

import { MonadCancelLaws } from './monad-cancel-laws';

export const SpawnLaws = <F, E>(F: Spawn<F, E>): SpawnLaws<F, E> => ({
  ...MonadCancelLaws(F),

  raceDerivesFromRacePairLeft: <A, B>(
    fa: Kind<F, [A]>,
  ): IsEq<Kind<F, [Either<A, B>]>> => {
    const result: Kind<F, [Either<A, B>]> = F.uncancelable(poll =>
      pipe(
        F.racePair_<A, B>(fa, F.never),
        F.flatMap(ea =>
          ea.fold(
            ([oc, f]) =>
              oc.fold(
                () =>
                  pipe(
                    poll(f.join),
                    F.onCancel(f.cancel),
                    F.flatMap(oc2 =>
                      oc2.fold(
                        () => F.productR_(F.canceled, F.never),
                        eb => F.throwError(eb),
                        fb => F.map_(fb, Right),
                      ),
                    ),
                  ),
                e => F.productR_(f.cancel, F.throwError(e)),
                fa => F.productR_(f.cancel, F.map_(fa, Left)),
              ),
            ([f, oc]) =>
              oc.fold(
                () =>
                  pipe(
                    poll(f.join),
                    F.onCancel(f.cancel),
                    F.flatMap(oc2 =>
                      oc2.fold(
                        () => F.productR_(F.canceled, F.never),
                        ea => F.throwError(ea),
                        fa => F.map_(fa, Left),
                      ),
                    ),
                  ),
                ea => F.productR_(f.cancel, F.throwError(ea)),
                fb => F.productR_(f.cancel, F.map_(fb, Right)),
              ),
          ),
        ),
      ),
    );

    return new IsEq(F.race_<A, B>(fa, F.never), result);
  },

  raceDerivesFromRacePairRight: <A, B>(
    fb: Kind<F, [B]>,
  ): IsEq<Kind<F, [Either<A, B>]>> => {
    const result: Kind<F, [Either<A, B>]> = F.uncancelable(poll =>
      pipe(
        F.racePair_<A, B>(F.never, fb),
        F.flatMap(ea =>
          ea.fold(
            ([oc, f]) =>
              oc.fold(
                () =>
                  pipe(
                    poll(f.join),
                    F.onCancel(f.cancel),
                    F.flatMap(oc2 =>
                      oc2.fold(
                        () => F.productR_(F.canceled, F.never),
                        eb => F.throwError(eb),
                        fb => F.map_(fb, Right),
                      ),
                    ),
                  ),
                e => F.productR_(f.cancel, F.throwError(e)),
                fa => F.productR_(f.cancel, F.map_(fa, Left)),
              ),
            ([f, oc]) =>
              oc.fold(
                () =>
                  pipe(
                    poll(f.join),
                    F.onCancel(f.cancel),
                    F.flatMap(oc2 =>
                      oc2.fold(
                        () => F.productR_(F.canceled, F.never),
                        ea => F.throwError(ea),
                        fa => F.map_(fa, Left),
                      ),
                    ),
                  ),
                ea => F.productR_(f.cancel, F.throwError(ea)),
                fb => F.productR_(f.cancel, F.map_(fb, Right)),
              ),
          ),
        ),
      ),
    );

    return new IsEq(F.race_<A, B>(F.never, fb), result);
  },

  raceCanceledIdentityLeft: <A>(
    fa: Kind<F, [A]>,
  ): IsEq<Kind<F, [Either<never, A>]>> =>
    new IsEq(
      F.race_(
        pipe(fa, F.flatMap(F.pure), F.handleErrorWith(F.throwError)),
        F.canceled,
      ),
      F.map_(fa, Left),
    ),

  raceCanceledIdentityRight: <A>(
    fa: Kind<F, [A]>,
  ): IsEq<Kind<F, [Either<A, never>]>> =>
    new IsEq(
      F.race_(
        F.canceled,
        pipe(fa, F.flatMap(F.pure), F.handleErrorWith(F.throwError)),
      ),
      F.map_(fa, Right),
    ),

  raceNeverNonCanceledIdentityLeft: <A>(
    fa: Kind<F, [A]>,
  ): IsEq<Kind<F, [Either<never, A>]>> =>
    new IsEq(
      F.race_(
        pipe(fa, F.flatMap(F.pure), F.handleErrorWith(F.throwError)),
        F.never,
      ),
      pipe(
        fa,
        F.flatMap(r => F.pure(Left(r))),
        F.handleErrorWith(F.throwError),
        F.onCancel(F.never),
      ),
    ),

  raceNeverNonCanceledIdentityRight: <A>(
    fa: Kind<F, [A]>,
  ): IsEq<Kind<F, [Either<A, never>]>> =>
    new IsEq(
      F.race_(
        F.never,
        pipe(fa, F.flatMap(F.pure), F.handleErrorWith(F.throwError)),
      ),
      pipe(
        fa,
        F.flatMap(r => F.pure(Right(r))),
        F.handleErrorWith(F.throwError),
        F.onCancel(F.never),
      ),
    ),

  fiberPureIsOutcomeCompletedPure: <A>(
    a: A,
  ): IsEq<Kind<F, [Outcome<F, E, A>]>> =>
    new IsEq(
      pipe(
        F.pure(a),
        F.fork,
        F.flatMap(f => f.join),
      ),
      F.pure(Outcome.success(F.pure(a))),
    ),

  fiberErrorIsOutcomeErrored: (e: E): IsEq<Kind<F, [Outcome<F, E, never>]>> =>
    new IsEq(
      pipe(
        F.throwError(e),
        F.fork,
        F.flatMap(f => f.join),
      ),
      F.pure(Outcome.failure(e)),
    ),

  fiberCancelationIsOutcomeCanceled: (): IsEq<Kind<F, [Outcome<F, E, void>]>> =>
    new IsEq(
      pipe(
        F.canceled,
        F.fork,
        F.flatMap(f => f.join),
      ),
      F.pure(Outcome.canceled()),
    ),

  fiberNeverIsNever: (): IsEq<Kind<F, [never]>> =>
    new IsEq(
      pipe(
        F.never,
        F.fork,
        F.flatMap(f => f.join),
      ),
      F.never,
    ),

  fiberForkOfNeverIsUnit: (): IsEq<Kind<F, [void]>> =>
    new IsEq(pipe(F.never, F.fork, F.void), F.unit),

  fiberJoinIsFinalize: <A>(
    fa0: Kind<F, [A]>,
    f: (oc: Outcome<F, E, A>) => Kind<F, [void]>,
  ): IsEq<Kind<F, [void]>> => {
    const fa = pipe(fa0, F.flatMap(F.pure), F.handleErrorWith<A>(F.throwError));

    return new IsEq(
      pipe(
        fa,
        F.fork,
        F.flatMap(f => f.join),
        F.flatMap(oc =>
          F.uncancelable(poll => {
            const result = oc.fold(
              () => F.productR_(F.canceled, F.never),
              F.throwError,
              id,
            );
            const finalized = F.onCancel_(poll(result), f(Outcome.canceled()));
            const handled = F.onError_(finalized, e =>
              F.handleError_(f(Outcome.failure(e)), () => {}),
            );
            return F.flatTap_(handled, a => f(Outcome.success(F.pure(a))));
          }),
        ),
      ),
      F.finalize_(fa, f),
    );
  },

  neverDominatesOverFlatMap: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.flatMap_(F.never, () => fa),
      F.never,
    ),

  uncancelableRaceNotInherited: (): IsEq<Kind<F, [void]>> =>
    new IsEq(
      F.void(F.uncancelable(() => F.race_(F.never, F.canceled))),
      F.never,
    ),

  uncancelableCancelCancels: (): IsEq<Kind<F, [void]>> =>
    new IsEq(
      pipe(
        F.never,
        F.fork,
        F.flatMap(f =>
          F.productR_(
            F.uncancelable(() => f.cancel),
            f.join,
          ),
        ),
      ),
      F.pure<Outcome<F, E, void>>(Outcome.canceled<F>()),
    ),

  uncancelableForkIsCancelable: (): IsEq<Kind<F, [void]>> =>
    new IsEq(
      F.uncancelable(() =>
        pipe(
          F.never,
          F.fork,
          F.flatMap(f => F.productR_(f.cancel, f.join)),
        ),
      ),
      F.pure<Outcome<F, E, void>>(Outcome.canceled<F>()),
    ),
});

export interface SpawnLaws<F, E> extends MonadCancelLaws<F, E> {
  raceDerivesFromRacePairLeft: <A, B>(
    fa: Kind<F, [A]>,
  ) => IsEq<Kind<F, [Either<A, B>]>>;

  raceDerivesFromRacePairRight: <A, B>(
    fb: Kind<F, [B]>,
  ) => IsEq<Kind<F, [Either<A, B>]>>;

  raceCanceledIdentityLeft: <A>(
    fa: Kind<F, [A]>,
  ) => IsEq<Kind<F, [Either<never, A>]>>;

  raceCanceledIdentityRight: <A>(
    fa: Kind<F, [A]>,
  ) => IsEq<Kind<F, [Either<A, never>]>>;

  raceNeverNonCanceledIdentityLeft: <A>(
    fa: Kind<F, [A]>,
  ) => IsEq<Kind<F, [Either<never, A>]>>;

  raceNeverNonCanceledIdentityRight: <A>(
    fa: Kind<F, [A]>,
  ) => IsEq<Kind<F, [Either<A, never>]>>;

  fiberPureIsOutcomeCompletedPure: <A>(
    a: A,
  ) => IsEq<Kind<F, [Outcome<F, E, A>]>>;

  fiberErrorIsOutcomeErrored: (e: E) => IsEq<Kind<F, [Outcome<F, E, never>]>>;

  fiberCancelationIsOutcomeCanceled: () => IsEq<Kind<F, [Outcome<F, E, void>]>>;

  fiberNeverIsNever: () => IsEq<Kind<F, [never]>>;

  fiberForkOfNeverIsUnit: () => IsEq<Kind<F, [void]>>;

  fiberJoinIsFinalize: <A>(
    fa0: Kind<F, [A]>,
    f: (oc: Outcome<F, E, A>) => Kind<F, [void]>,
  ) => IsEq<Kind<F, [void]>>;

  neverDominatesOverFlatMap: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;

  uncancelableRaceNotInherited: () => IsEq<Kind<F, [void]>>;

  uncancelableCancelCancels: () => IsEq<Kind<F, [void]>>;

  uncancelableForkIsCancelable: () => IsEq<Kind<F, [void]>>;
}
