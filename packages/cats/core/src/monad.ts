// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Kind, pipe } from '@fp4ts/core';
import { Apply } from './apply';
import { Applicative } from './applicative';
import { FlatMap } from './flat-map';
import { Functor } from './functor';

/**
 * @category Type Class
 */
export interface Monad<F> extends FlatMap<F>, Applicative<F> {
  do<Eff extends GenKind<Kind<F, [any]>, any>, R>(
    f: (
      fa: <A>(fa: Kind<F, [A]>) => GenKind<Kind<F, [A]>, A>,
    ) => Generator<Eff, R, any>,
  ): Kind<F, [R]>;
}

export type MonadRequirements<F> = Pick<
  Monad<F>,
  'flatMap_' | 'pure' | 'tailRecM_'
> &
  Partial<Monad<F>>;
export const Monad = Object.freeze({
  of: <M>(M: MonadRequirements<M>): Monad<M> => {
    const F = Monad.deriveFlatMap(M);
    const A = Monad.deriveApplicative(M);

    const self: Monad<M> = { ...F, ...A, ...M } as any;
    self.do = Monad.Do(self);
    return self;
  },

  deriveFunctor: <F>(F: MonadRequirements<F>): Functor<F> =>
    Functor.of({ map_: (fa, f) => F.flatMap_(fa, x => F.pure(f(x))), ...F }),

  deriveApply: <F>(F: MonadRequirements<F>): Apply<F> => {
    const self: Apply<F> = Apply.of({
      ap_: (ff, fa) => F.flatMap_(ff, f => self.map_(fa, a => f(a))),
      ...Monad.deriveFunctor(F),
      ...F,
    });
    return self;
  },

  deriveApplicative: <F>(F: MonadRequirements<F>): Applicative<F> =>
    Applicative.of({
      ...Monad.deriveApply(F),
      ...F,
    }),

  deriveFlatMap: <F>(F: MonadRequirements<F>): FlatMap<F> =>
    FlatMap.of({
      ...Monad.deriveApply(F),
      ...F,
    }),

  // -- Generator Based Do notation

  // from Effect-TS https://github.com/Effect-TS/core/blob/340cdaf66fa233195a65661ab29aa3a9f813763a/packages/core/src/Prelude/DSL/gen.ts#L153
  Do<F>(
    F: Monad<F>,
  ): <Eff extends GenKind<Kind<F, [any]>, any>, R>(
    f: (
      fa: <A>(fa: Kind<F, [A]>) => GenKind<Kind<F, [A]>, A>,
    ) => Generator<Eff, R, any>,
  ) => Kind<F, [R]> {
    return function doNotation<Eff extends GenKind<Kind<F, [any]>, any>, R>(
      f: (
        fa: <A>(fa: Kind<F, [A]>) => GenKind<Kind<F, [A]>, A>,
      ) => Generator<Eff, R, any>,
    ): Kind<F, [R]> {
      return pipe(
        F.unit,
        F.flatMap(() => {
          const iterator = f(adapter);
          const state = iterator.next();

          const run = (
            state: IteratorYieldResult<Eff> | IteratorReturnResult<R>,
          ): Kind<F, [R]> =>
            state.done
              ? F.pure(state.value)
              : F.flatMap_((state.value as Eff).effect, val => {
                  const next = iterator.next(val);
                  return run(next);
                });

          return run(state);
        }),
      );
    };
  },
});

class GenKind<FA, A> {
  public constructor(public readonly effect: FA) {}

  public *[Symbol.iterator](): Generator<GenKind<FA, A>, A, any> {
    return yield this;
  }
}

function adapter<F, A>(fa: Kind<F, [A]>): GenKind<Kind<F, [A]>, A> {
  return new GenKind(fa);
}
