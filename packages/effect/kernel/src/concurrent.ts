// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ok as assert } from 'assert';
import { $, id, Kind, pipe, tupled } from '@fp4ts/core';
import {
  Traversable,
  Either,
  Left,
  Right,
  KleisliK,
  Kleisli,
  OptionTK,
  OptionT,
} from '@fp4ts/cats';
import { Spawn, SpawnRequirements } from './spawn';
import { Ref } from './ref';
import { Fiber } from './fiber';
import { Outcome } from './outcome';
import { Deferred } from './deferred';
import { Semaphore } from './semaphore';

export interface Concurrent<F, E> extends Spawn<F, E> {
  readonly ref: <A>(a: A) => Kind<F, [Ref<F, A>]>;

  readonly deferred: <A>() => Kind<F, [Deferred<F, A>]>;

  readonly parTraverseN: <T>(
    T: Traversable<T>,
  ) => <A, B>(
    maxConcurrent: number,
    f: (a: A) => Kind<F, [B]>,
  ) => (ts: Kind<T, [A]>) => Kind<F, [Kind<T, [B]>]>;
  readonly parTraverseN_: <T>(
    T: Traversable<T>,
  ) => <A>(
    ts: Kind<T, [A]>,
    maxConcurrent: number,
  ) => <B>(f: (a: A) => Kind<F, [B]>) => Kind<F, [Kind<T, [B]>]>;

  readonly parSequenceN: <T>(
    T: Traversable<T>,
  ) => (
    maxConcurrent: number,
  ) => <A>(tfa: Kind<T, [Kind<F, [A]>]>) => Kind<F, [Kind<T, [A]>]>;
  readonly parSequenceN_: <T>(
    T: Traversable<T>,
  ) => <A>(
    tfa: Kind<T, [Kind<F, [A]>]>,
    maxConcurrent: number,
  ) => Kind<F, [Kind<T, [A]>]>;
}

export type ConcurrentRequirements<F, E> = Pick<
  Concurrent<F, E>,
  'ref' | 'deferred'
> &
  Omit<SpawnRequirements<F, E>, 'racePair_'> &
  Partial<Concurrent<F, E>>;
export const Concurrent = Object.freeze({
  of: <F, E>(F: ConcurrentRequirements<F, E>): Concurrent<F, E> => {
    const self: Concurrent<F, E> = {
      parTraverseN: T => (maxConcurrent, f) => ta =>
        self.parTraverseN_(T)(ta, maxConcurrent)(f),
      parTraverseN_: T => (ta, maxConcurrent) => f => {
        assert(maxConcurrent >= 1, 'Concurrency limit must be >= 1');

        return F.flatMap_(Semaphore.withPermits(self)(maxConcurrent), sem =>
          self.parTraverse_(T)(ta, a => sem.withPermit(f(a))),
        );
      },

      parSequenceN: T => maxConcurrent => tfa =>
        self.parSequenceN_(T)(tfa, maxConcurrent),
      parSequenceN_: T => (tfa, maxConcurrent) =>
        self.parTraverseN_(T)(tfa, maxConcurrent)(id),

      ...Spawn.of({
        racePair_:
          F.racePair_ ??
          (<A, B>(
            fa: Kind<F, [A]>,
            fb: Kind<F, [B]>,
          ): Kind<
            F,
            [
              Either<
                [Outcome<F, E, A>, Fiber<F, E, B>],
                [Fiber<F, E, A>, Outcome<F, E, B>]
              >,
            ]
          > =>
            self.uncancelable(poll =>
              pipe(
                self.Do,
                self.bindTo(
                  'result',
                  self.deferred<Either<Outcome<F, E, A>, Outcome<F, E, B>>>(),
                ),

                self.bindTo('fiberA', ({ result }) =>
                  pipe(
                    fa,
                    self.finalize(oc => result.complete(Left(oc))),
                    self.fork,
                  ),
                ),
                self.bindTo('fiberB', ({ result }) =>
                  pipe(
                    fb,
                    self.finalize(oc => result.complete(Right(oc))),
                    self.fork,
                  ),
                ),

                self.bindTo('back', ({ result, fiberA, fiberB }) =>
                  F.onCancel_(
                    poll(result.get()),
                    pipe(
                      self.Do,
                      self.bindTo('cancelA', self.fork(fiberA.cancel)),
                      self.bindTo('cancelB', self.fork(fiberB.cancel)),
                      self.bind(({ cancelA }) => cancelA.join),
                      self.bind(({ cancelB }) => cancelB.join),
                      self.void,
                    ),
                  ),
                ),

                self.map(({ back, fiberA, fiberB }) =>
                  back.fold(
                    oc => Left(tupled(oc, fiberB)),
                    oc => Right(tupled(fiberA, oc)),
                  ),
                ),
              ),
            )),
        ...F,
      }),
      ...F,
    };
    return self;
  },

  forKleisli: <F, E, R>(
    F: Concurrent<F, E>,
  ): Concurrent<$<KleisliK, [F, R]>, E> =>
    Concurrent.of<$<KleisliK, [F, R]>, E>({
      ...Spawn.forKleisli<F, E, R>(F),

      ref: <A>(a: A) =>
        Kleisli.liftF(F.map_(F.ref<A>(a), ref => ref.mapK(Kleisli.liftF))),

      deferred: () =>
        Kleisli.liftF(
          F.map_(F.deferred(), deferred => deferred.mapK(Kleisli.liftF)),
        ),
    }),

  forOptionT: <F, E>(F: Concurrent<F, E>): Concurrent<$<OptionTK, [F]>, E> =>
    Concurrent.of<$<OptionTK, [F]>, E>({
      ...Spawn.forOptionT<F, E>(F),

      ref: <A>(a: A) =>
        OptionT.liftF(F)(
          F.map_(F.ref<A>(a), ref => ref.mapK(OptionT.liftF(F))),
        ),

      deferred: <A>() =>
        OptionT.liftF(F)(
          F.map_(F.deferred<A>(), deferred => deferred.mapK(OptionT.liftF(F))),
        ),
    }),
});
