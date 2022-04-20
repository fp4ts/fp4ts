// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { id, Kind, pipe } from '@fp4ts/core';
import {
  List,
  Applicative,
  ApplicativeError,
  Monad,
  MonadError,
} from '@fp4ts/cats';
import {
  Sync,
  MonadCancel,
  Spawn,
  Temporal,
  Async,
  ExecutionContext,
} from '@fp4ts/effect-kernel';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

export interface GenK<F> {
  <A>(arbA: Arbitrary<A>): Arbitrary<Kind<F, [A]>>;
}

export interface KindGenerator<F> {
  readonly baseGen: <A>(
    arbA: Arbitrary<A>,
  ) => List<[string, Arbitrary<Kind<F, [A]>>]>;
  readonly recursiveGen: <A>(
    arbA: Arbitrary<A>,
    deeper: GenK<F>,
  ) => List<[string, Arbitrary<Kind<F, [A]>>]>;
}

export const ApplicativeGenerators = <F>(
  F: Applicative<F>,
): KindGenerator<F> => {
  const genMap = <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
    fc.func<[A], A>(arbA).chain(f => deeper(arbA).map(F.map(f)));
  const genAp = <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
    deeper<A>(arbA).chain(fa => deeper(fc.func<[A], A>(arbA)).map(F.ap(fa)));

  return {
    baseGen: <A>(arbA: Arbitrary<A>) => List(['pure', arbA.map(F.pure)]),
    recursiveGen: <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
      List(['map', genMap(arbA, deeper)], ['ap', genAp(arbA, deeper)]),
  };
};

export const MonadGenerators = <F>(F: Monad<F>): KindGenerator<F> => {
  const applicativeGenerators = ApplicativeGenerators(F);

  const genFlatMap = <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
    fc
      .func<[A], Kind<F, [A]>>(deeper(arbA))
      .chain(f => deeper(arbA).map(F.flatMap(f)));

  return {
    baseGen: <A>(arbA: Arbitrary<A>) => applicativeGenerators.baseGen(arbA),

    recursiveGen: <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
      applicativeGenerators
        .recursiveGen(arbA, deeper)
        .prepend(['flatMap', genFlatMap(arbA, deeper)]),
  };
};

export const ApplicativeErrorGenerators = <F, E>(
  F: ApplicativeError<F, E>,
  arbE: Arbitrary<E>,
): KindGenerator<F> => {
  const applicativeGenerators = ApplicativeGenerators(F);

  const genThrowError = <A>(): Arbitrary<Kind<F, [A]>> =>
    arbE.map(F.throwError);

  const genHandleErrorWith = <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
    fc
      .func<[E], Kind<F, [A]>>(deeper(arbA))
      .chain(f => deeper(arbA).map(F.handleErrorWith(f)));

  return {
    baseGen: <A>(arbA: Arbitrary<A>) =>
      applicativeGenerators
        .baseGen(arbA)
        .prepend(['throwError', genThrowError<A>()]),
    recursiveGen: <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
      applicativeGenerators
        .recursiveGen(arbA, deeper)
        .prepend(['handleErrorWith', genHandleErrorWith(arbA, deeper)]),
  };
};

export const MonadErrorGenerators = <F, E>(
  F: MonadError<F, E>,
  arbE: Arbitrary<E>,
): KindGenerator<F> => {
  const applicativeErrorGenerators = ApplicativeErrorGenerators(F, arbE);
  const monadGenerators = MonadGenerators(F);

  return {
    baseGen: <A>(arbA: Arbitrary<A>) =>
      applicativeErrorGenerators
        .baseGen(arbA)
        ['+++'](monadGenerators.baseGen(arbA)),
    recursiveGen: <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
      applicativeErrorGenerators
        .recursiveGen(arbA, deeper)
        ['+++'](monadGenerators.recursiveGen(arbA, deeper)),
  };
};

export const SyncGenerators = <F>(
  F: Sync<F>,
  arbE: Arbitrary<Error>,
): KindGenerator<F> => {
  const monadErrorGens = MonadErrorGenerators(F, arbE);

  return {
    baseGen: <A>(arbA: Arbitrary<A>) =>
      monadErrorGens
        .baseGen(arbA)
        .prepend(['prepend', arbA.map(x => F.delay(() => x))]),
    recursiveGen: <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
      monadErrorGens.recursiveGen(arbA, deeper),
  };
};

export const MonadCancelGenerators = <F, E>(
  F: MonadCancel<F, E>,
  arbE: Arbitrary<E>,
): KindGenerator<F> => {
  const monadErrorGens = MonadErrorGenerators(F, arbE);

  const genCanceled = <A>(arbA: Arbitrary<A>) =>
    arbA.map(a => F.map_(F.canceled, () => a));

  const genUncancelable = <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
    deeper(arbA).map(pc =>
      pipe(
        F.uncancelable(() => pc),
        F.flatMap(x => F.pure(x)),
        F.handleErrorWith(e => F.throwError<A>(e)),
      ),
    );

  const genOnCancel = <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
    deeper(arbA).chain(fin =>
      deeper(arbA).map(F.onCancel(F.map_<A, void>(fin, () => undefined))),
    );

  return {
    baseGen: <A>(arbA: Arbitrary<A>) =>
      monadErrorGens.baseGen(arbA).prepend(['canceled', genCanceled(arbA)]),
    recursiveGen: <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
      List<[string, Arbitrary<Kind<F, [A]>>]>(
        ['uncancelable', genUncancelable(arbA, deeper)],
        ['onCancel', genOnCancel(arbA, deeper)],
      )['+++'](monadErrorGens.recursiveGen(arbA, deeper)),
  };
};

export const SpawnGenerators = <F, E>(
  F: Spawn<F, E>,
  arbE: Arbitrary<E>,
): KindGenerator<F> => {
  const monadCancelGens = MonadCancelGenerators(F, arbE);

  const genSuspend = <A>(arbA: Arbitrary<A>) =>
    arbA.map(a => F.map_(F.suspend, () => a));

  const genFork = <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
    deeper(fc.constant(undefined as void)).chain(fa =>
      arbA.map(a => F.map_(F.fork(fa), () => a)),
    );

  const genJoin = <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
    deeper(arbA).chain(fiber =>
      deeper(fc.constant(undefined as void)).chain(cont =>
        arbA.map(a =>
          pipe(
            F.fork(fiber),
            F.flatMap(f => F.productR_(cont, f.join)),
            F.map(() => a),
          ),
        ),
      ),
    );

  const genRacePair = <A>(
    arbA: Arbitrary<A>,
    deeper: GenK<F>,
  ): Arbitrary<Kind<F, [A]>> =>
    deeper(arbA).chain(fa =>
      deeper(arbA).chain(fb =>
        fc.boolean().map(cancel =>
          pipe(
            F.racePair_(fa, fb),
            F.flatMap(ea =>
              ea.fold(
                ([oc, f]) =>
                  cancel
                    ? F.productR_(
                        f.cancel,
                        oc.fold(() => F.never, F.throwError, id),
                      )
                    : F.productR_(
                        f.join,
                        oc.fold(() => F.never, F.throwError, id),
                      ),
                ([f, oc]) =>
                  cancel
                    ? F.productR_(
                        f.cancel,
                        oc.fold(() => F.never, F.throwError, id),
                      )
                    : F.productR_(
                        f.join,
                        oc.fold(() => F.never, F.throwError, id),
                      ),
              ),
            ),
          ),
        ),
      ),
    );

  return {
    baseGen: <A>(arbA: Arbitrary<A>) =>
      List<[string, Arbitrary<Kind<F, [A]>>]>(
        ['suspend', genSuspend(arbA)],
        ['never', fc.constant(F.never)],
      )['+++'](monadCancelGens.baseGen(arbA)),

    recursiveGen: <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
      List<[string, Arbitrary<Kind<F, [A]>>]>(
        ['racePair', genRacePair<A>(arbA, deeper)],
        ['fork', genFork(arbA, deeper)],
        ['join', genJoin(arbA, deeper)],
      )['+++'](monadCancelGens.recursiveGen(arbA, deeper)),
  };
};

export const TemporalGenerators = <F, E>(
  F: Temporal<F, E>,
  arbE: Arbitrary<E>,
): KindGenerator<F> => {
  const spawnGens = SpawnGenerators(F, arbE);

  const genSleep = <A>(arbA: Arbitrary<A>): Arbitrary<Kind<F, [A]>> =>
    fc
      .integer()
      .filter(n => n >= 0)
      .chain(d => arbA.map(a => F.map_(F.sleep(d), () => a)));

  return {
    baseGen: <A>(arbA: Arbitrary<A>) =>
      spawnGens.baseGen(arbA).prepend(['sleep', genSleep(arbA)]),

    recursiveGen: <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
      spawnGens.recursiveGen(arbA, deeper),
  };
};

export const AsyncGenerators = <F>(
  F: Async<F>,
  arbE: Arbitrary<Error>,
  arbEC: Arbitrary<ExecutionContext>,
): KindGenerator<F> => {
  const temporalGens = TemporalGenerators(F, arbE);
  const syncGens = SyncGenerators(F, arbE);

  const genAsync = <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
    A.fp4tsEither(arbE, arbA).chain(result =>
      deeper(
        A.fp4tsOption(
          deeper(arbA).map(fa => F.map_<A, void>(fa, () => undefined)),
        ),
      ).map(fo =>
        pipe(
          F.async<A>(k =>
            F.flatMap_(
              F.delay(() => k(result)),
              () => fo,
            ),
          ),
          F.flatMap(x => F.pure(x)),
          F.handleErrorWith(e => F.throwError<A>(e)),
        ),
      ),
    );

  const genExecuteOn = <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
    deeper(arbA).chain(fa => arbEC.map(ec => F.executeOn_(fa, ec)));

  return {
    baseGen: <A>(arbA: Arbitrary<A>) =>
      temporalGens.baseGen(arbA)['+++'](syncGens.baseGen(arbA)),

    recursiveGen: <A>(arbA: Arbitrary<A>, deeper: GenK<F>) =>
      List<[string, Arbitrary<Kind<F, [A]>>]>(
        ['async', genAsync(arbA, deeper)],
        ['executeOn', genExecuteOn(arbA, deeper)],
      )
        ['+++'](temporalGens.recursiveGen(arbA, deeper))
        ['+++'](syncGens.recursiveGen(arbA, deeper)),
  };
};
