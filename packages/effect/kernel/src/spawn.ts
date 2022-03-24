// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe, tupled, $, HKT1, HKT } from '@fp4ts/core';
import {
  Applicative,
  Parallel,
  FunctionK,
  Either,
  Left,
  Right,
  KleisliF,
  Kleisli,
  Option,
  OptionTF,
  OptionT,
  Traversable,
} from '@fp4ts/cats';

import { Poll } from './poll';
import { Fiber } from './fiber';
import { Outcome } from './outcome';
import { Resource } from './resource';
import { Unique, UniqueRequirements } from './unique';
import { MonadCancel, MonadCancelRequirements } from './monad-cancel';

export interface Spawn<F, E> extends MonadCancel<F, E>, Unique<F> {
  readonly fork: <A>(fa: Kind<F, [A]>) => Kind<F, [Fiber<F, E, A>]>;
  readonly never: Kind<F, [never]>;
  readonly suspend: Kind<F, [void]>;

  readonly background: <A>(
    fa: Kind<F, [A]>,
  ) => Resource<F, Kind<F, [Outcome<F, E, A>]>>;

  readonly racePair: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(
    fa: Kind<F, [A]>,
  ) => Kind<
    F,
    [
      Either<
        [Outcome<F, E, A>, Fiber<F, E, B>],
        [Fiber<F, E, A>, Outcome<F, E, B>]
      >,
    ]
  >;
  readonly racePair_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<
    F,
    [
      Either<
        [Outcome<F, E, A>, Fiber<F, E, B>],
        [Fiber<F, E, A>, Outcome<F, E, B>]
      >,
    ]
  >;

  readonly race: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(fa: Kind<F, [A]>) => Kind<F, [Either<A, B>]>;
  readonly race_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<F, [Either<A, B>]>;

  readonly raceOutcome: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(
    fa: Kind<F, [A]>,
  ) => Kind<F, [Either<Outcome<F, E, A>, Outcome<F, E, B>>]>;
  readonly raceOutcome_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<F, [Either<Outcome<F, E, A>, Outcome<F, E, B>>]>;

  readonly both: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(fa: Kind<F, [A]>) => Kind<F, [[A, B]]>;
  readonly both_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<F, [[A, B]]>;

  readonly bothOutcome: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(fa: Kind<F, [A]>) => Kind<F, [[Outcome<F, E, A>, Outcome<F, E, B>]]>;
  readonly bothOutcome_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<F, [[Outcome<F, E, A>, Outcome<F, E, B>]]>;

  readonly parTraverse: <T>(
    T: Traversable<T>,
  ) => <A, B>(
    f: (a: A) => Kind<F, [B]>,
  ) => (ta: Kind<T, [A]>) => Kind<[F, T], [B]>;
  readonly parTraverse_: <T>(
    T: Traversable<T>,
  ) => <A, B>(ta: Kind<T, [A]>, f: (a: A) => Kind<F, [B]>) => Kind<[F, T], [B]>;

  readonly parSequence: <T>(
    T: Traversable<T>,
  ) => <A>(tfa: Kind<[T, F], [A]>) => Kind<[F, T], [A]>;
}

function of<F, E>(F: SpawnRequirements<F, E>): Spawn<F, E>;
function of<F, E>(F: SpawnRequirements<HKT1<F>, E>): Spawn<HKT1<F>, E> {
  type HKTF = HKT1<F>;
  const self: Spawn<HKTF, E> = {
    background: <A>(
      fa: HKT<F, [A]>,
    ): Resource<HKTF, HKT<F, [Outcome<HKTF, E, A>]>> =>
      Resource.make(self)(self.fork(fa), f => f.cancel).map(f => f.join),

    racePair: fb => fa => self.racePair_(fa, fb),

    race: fb => fa => self.race_(fa, fb),
    race_: <A, B>(fa: HKT<F, [A]>, fb: HKT<F, [B]>) => {
      const cont = <X, Y>(
        poll: Poll<HKTF>,
        oc: Outcome<HKTF, E, X>,
        f: Fiber<HKTF, E, Y>,
      ): HKT<F, [Either<X, Y>]> =>
        oc.fold(
          (): HKT<F, [Either<X, Y>]> =>
            pipe(
              poll(f.join),
              self.onCancel(f.cancel),
              self.flatMap(oc =>
                oc.fold(
                  () => self.flatMap_(poll(self.canceled), () => self.never),
                  ey => self.throwError(ey),
                  fy => self.map_(fy, Right),
                ),
              ),
            ),
          ex => F.flatMap_(f.cancel, () => F.throwError(ex)),
          fx =>
            pipe(
              f.cancel,
              self.flatMap(() => f.join),
              self.flatMap(oc =>
                oc.fold(
                  () => self.map_(fx, Left),
                  ey => F.throwError(ey),
                  () => self.map_(fx, Left),
                ),
              ),
            ),
        );

      return self.uncancelable(poll =>
        pipe(
          poll(self.racePair_(fa, fb)),
          self.flatMap(ea =>
            ea.fold(
              ([oc, f]) => cont(poll, oc, f),
              ([f, oc]) =>
                pipe(
                  cont(poll, oc, f),
                  self.map(ea => ea.swapped),
                ),
            ),
          ),
        ),
      );
    },

    raceOutcome: fb => fa => self.raceOutcome_(fa, fb),
    raceOutcome_: <A, B>(
      fa: HKT<F, [A]>,
      fb: HKT<F, [B]>,
    ): HKT<F, [Either<Outcome<HKTF, E, A>, Outcome<HKTF, E, B>>]> =>
      self.uncancelable(() =>
        pipe(
          self.racePair_(fa, fb),
          self.flatMap(ea =>
            ea.fold(
              ([oc, f]) =>
                pipe(
                  f.cancel,
                  self.map(() => Left(oc)),
                ),
              ([f, oc]) =>
                pipe(
                  f.cancel,
                  self.map(() => Right(oc)),
                ),
            ),
          ),
        ),
      ),

    both: fb => fa => self.both_(fa, fb),
    both_: <A, B>(fa: HKT<F, [A]>, fb: HKT<F, [B]>) => {
      const cont = <X, Y>(
        poll: Poll<HKTF>,
        oc: Outcome<HKTF, E, X>,
        f: Fiber<HKTF, E, Y>,
      ): HKT<F, [[X, Y]]> =>
        oc.fold(
          () =>
            pipe(
              f.cancel,
              self.flatMap(() => poll(self.canceled)),
              self.flatMap(() => self.never),
            ),
          ex => self.flatMap_(f.cancel, () => self.throwError(ex)),
          fx =>
            pipe(
              poll(f.join),
              self.onCancel(f.cancel),
              self.flatMap(oc =>
                oc.fold(
                  () => self.flatMap_(poll(self.canceled), () => self.never),
                  ey => self.throwError(ey),
                  fy => self.product_(fx, fy),
                ),
              ),
            ),
        );

      return self.uncancelable(poll =>
        pipe(
          poll(self.racePair_(fa, fb)),
          self.flatMap(ea =>
            ea.fold(
              ([oc, f]) => cont(poll, oc, f),
              ([f, oc]) =>
                pipe(
                  cont(poll, oc, f),
                  self.map(([b, a]) => [a, b]),
                ),
            ),
          ),
        ),
      );
    },

    bothOutcome: fb => fa => self.bothOutcome_(fa, fb),
    bothOutcome_: (fa, fb) =>
      self.uncancelable(poll =>
        pipe(
          poll(self.racePair_(fa, fb)),
          self.flatMap(ea =>
            ea.fold(
              ([oc, f]) =>
                pipe(
                  poll(f.join),
                  self.onCancel(f.cancel),
                  self.map(oc2 => [oc, oc2]),
                ),
              ([f, oc]) =>
                pipe(
                  poll(f.join),
                  self.onCancel(f.cancel),
                  self.map(oc2 => [oc2, oc]),
                ),
            ),
          ),
        ),
      ),

    parTraverse: T => f => ta => self.parTraverse_(T)(ta, f),
    parTraverse_: T => Parallel.parTraverse_(T, Spawn.parallelForSpawn(self)),

    parSequence: T => Parallel.parSequence(T, Spawn.parallelForSpawn(self)),

    ...MonadCancel.of(F),
    ...F,
  };
  return self;
}

function parallelForSpawn<M, E>(M: Spawn<M, E>): Parallel<M, M>;
function parallelForSpawn<M, E>(
  M: Spawn<HKT1<M>, E>,
): Parallel<HKT1<M>, HKT1<M>> {
  return Parallel.of<HKT1<M>, HKT1<M>>({
    applicative: Spawn.parallelApplicative(M),
    monad: M,
    sequential: FunctionK.id(),
    parallel: FunctionK.id(),
  });
}

function parallelApplicative<F, E>(F: Spawn<F, E>): Applicative<F>;
function parallelApplicative<F, E>(F: Spawn<HKT1<F>, E>): Applicative<HKT1<F>> {
  const self: Applicative<HKT1<F>> = Applicative.of({
    pure: F.pure,

    ap_: (ff, fa) => F.map2_(ff, fa)((f, a) => f(a)),

    product_: (fa, fb) => F.map2_(fa, fb)(tupled),

    map2_:
      <A, B>(fa: HKT<F, [A]>, fb: HKT<F, [B]>) =>
      <C>(f: (a: A, b: B) => C) =>
        F.uncancelable(poll =>
          F.do(function* (_) {
            const fiberA = yield* _(F.fork(fa));
            const fiberB = yield* _(F.fork(fb));

            yield* _(
              pipe(
                fiberB.join,
                F.flatMap(oc =>
                  oc.fold(
                    () => fiberA.cancel,
                    () => fiberA.cancel,
                    () => F.unit,
                  ),
                ),
                F.fork,
              ),
            );

            yield* _(
              pipe(
                fiberA.join,
                F.flatMap(oc =>
                  oc.fold(
                    () => fiberB.cancel,
                    () => fiberB.cancel,
                    () => F.unit,
                  ),
                ),
                F.fork,
              ),
            );

            const a = yield* _(
              pipe(
                poll(fiberA.join),
                F.onCancel(fiberB.cancel),
                F.onCancel(fiberA.cancel),
                F.flatMap(oc =>
                  oc.fold<HKT<F, [A]>>(
                    () =>
                      F.flatMap_(fiberB.cancel, () =>
                        pipe(
                          fiberB.join,
                          F.flatMap(oc =>
                            oc.fold(
                              () => F.flatMap_(F.canceled, () => F.never),
                              e => F.throwError(e),
                              () => F.flatMap_(F.canceled, () => F.never),
                            ),
                          ),
                          poll,
                        ),
                      ),
                    e => F.flatMap_(fiberB.cancel, () => F.throwError(e)),
                    fa => fa,
                  ),
                ),
              ),
            );

            const b = yield* _(
              pipe(
                poll(fiberB.join),
                F.onCancel(fiberB.cancel),
                F.flatMap(oc =>
                  oc.fold<HKT<F, [B]>>(
                    () =>
                      pipe(
                        fiberA.join,
                        F.flatMap(oc =>
                          oc.fold(
                            () => F.flatMap_(F.canceled, () => F.never),
                            e => F.throwError(e),
                            () => F.flatMap_(F.canceled, () => F.never),
                          ),
                        ),
                        poll,
                      ),
                    e => F.throwError(e),
                    fb => fb,
                  ),
                ),
              ),
            );
            return f(a, b);
          }),
        ),
  });
  return self;
}

function forKleisli<F, E, R>(F: Spawn<F, E>): Spawn<$<KleisliF, [F, R]>, E>;
function forKleisli<F, E, R>(
  F: Spawn<HKT1<F>, E>,
): Spawn<$<KleisliF, [HKT1<F>, R]>, E> {
  type HKTF = HKT1<F>;
  const liftOutcome = <A>(
    oc: Outcome<HKTF, E, A>,
  ): Outcome<$<KleisliF, [HKTF, R]>, E, A> => oc.mapK(Kleisli.liftF);

  const liftFiber = <A>(
    fiber: Fiber<HKTF, E, A>,
  ): Fiber<$<KleisliF, [HKTF, R]>, E, A> =>
    new (class extends Fiber<$<KleisliF, [HKTF, R]>, E, A> {
      readonly join: Kleisli<HKTF, R, Outcome<$<KleisliF, [HKTF, R]>, E, A>> =
        Kleisli.liftF(F.map_(fiber.join, liftOutcome));

      readonly cancel: Kleisli<HKTF, R, void> = Kleisli.liftF(fiber.cancel);
    })();

  return Spawn.of<$<KleisliF, [HKTF, R]>, E>({
    ...MonadCancel.forKleisli(F),

    unique: Kleisli.liftF(F.unique),

    fork: fa => Kleisli(r => F.map_(F.fork(fa.run(r)), liftFiber)),

    suspend: Kleisli.liftF(F.suspend),

    never: Kleisli.liftF(F.never),

    racePair_: <A, B>(
      fa: Kleisli<HKTF, R, A>,
      fb: Kleisli<HKTF, R, B>,
    ): Kleisli<
      HKTF,
      R,
      Either<
        [
          Outcome<$<KleisliF, [HKTF, R]>, E, A>,
          Fiber<$<KleisliF, [HKTF, R]>, E, B>,
        ],
        [
          Fiber<$<KleisliF, [HKTF, R]>, E, A>,
          Outcome<$<KleisliF, [HKTF, R]>, E, B>,
        ]
      >
    > =>
      Kleisli((r: R) =>
        F.uncancelable(poll =>
          poll(
            pipe(
              F.racePair_(fa.run(r), fb.run(r)),
              F.map(rea =>
                rea.fold(
                  ([oc, f]) => Left(tupled(liftOutcome(oc), liftFiber(f))),
                  ([f, oc]) => Right(tupled(liftFiber(f), liftOutcome(oc))),
                ),
              ),
            ),
          ),
        ),
      ),
  });
}

function forOptionT<F, E>(F: Spawn<F, E>): Spawn<$<OptionTF, [F]>, E>;
function forOptionT<F, E>(
  F: Spawn<HKT1<F>, E>,
): Spawn<$<OptionTF, [HKT1<F>]>, E> {
  type HKTF = HKT1<F>;
  const liftOutcome = <A>(
    oc: Outcome<HKTF, E, Option<A>>,
  ): Outcome<$<OptionTF, [HKTF]>, E, A> =>
    oc.fold(
      () => Outcome.canceled(),
      e => Outcome.failure(e),
      fa => Outcome.success(OptionT(fa)),
    );

  const liftFiber = <A>(
    fiber: Fiber<HKTF, E, Option<A>>,
  ): Fiber<$<OptionTF, [HKTF]>, E, A> =>
    new (class extends Fiber<$<OptionTF, [HKTF]>, E, A> {
      readonly join: OptionT<HKTF, Outcome<$<OptionTF, [HKTF]>, E, A>> =
        OptionT.liftF(F)(F.map_(fiber.join, liftOutcome));

      readonly cancel: OptionT<HKTF, void> = OptionT.liftF(F)(fiber.cancel);
    })();

  return Spawn.of<$<OptionTF, [HKTF]>, E>({
    ...MonadCancel.forOptionT(F),

    unique: OptionT.liftF(F)(F.unique),

    fork: fa => OptionT.liftF(F)(F.map_(F.fork(fa.value), liftFiber)),

    suspend: OptionT.liftF(F)(F.suspend),

    never: OptionT.liftF(F)(F.never),

    racePair_: <A, B>(
      fa: OptionT<HKTF, A>,
      fb: OptionT<HKTF, B>,
    ): OptionT<
      HKTF,
      Either<
        [Outcome<$<OptionTF, [HKTF]>, E, A>, Fiber<$<OptionTF, [HKTF]>, E, B>],
        [Fiber<$<OptionTF, [HKTF]>, E, A>, Outcome<$<OptionTF, [HKTF]>, E, B>]
      >
    > =>
      OptionT.liftF(F)(
        F.uncancelable(poll =>
          poll(
            pipe(
              F.racePair_(fa.value, fb.value),
              F.map(rea =>
                rea.fold(
                  ([oc, f]) => Left(tupled(liftOutcome(oc), liftFiber(f))),
                  ([f, oc]) => Right(tupled(liftFiber(f), liftOutcome(oc))),
                ),
              ),
            ),
          ),
        ),
      ),
  });
}

export type SpawnRequirements<F, E> = Pick<
  Spawn<F, E>,
  'fork' | 'never' | 'suspend' | 'racePair_'
> &
  MonadCancelRequirements<F, E> &
  UniqueRequirements<F> &
  Partial<Spawn<F, E>>;
export const Spawn = Object.freeze({
  of,
  parallelForSpawn,
  parallelApplicative,
  forKleisli,
  forOptionT,
});
