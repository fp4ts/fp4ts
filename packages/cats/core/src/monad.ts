// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { $type, EvalF, Kind, pipe, TyK, TyVar } from '@fp4ts/core';
import { Apply } from './apply';
import { Applicative } from './applicative';
import { FlatMap } from './flat-map';
import { Functor } from './functor';
import { StackSafeMonad } from './stack-safe-monad';
import { ArrayF, arrayMonad } from './instances/array';

/**
 * @category Type Class
 */
export interface Monad<F> extends FlatMap<F>, Applicative<F> {
  do<Eff extends GenKind<Kind<F, [any]>, any>, R>(
    f: (
      fa: <A>(fa: Kind<F, [A]>) => GenKind<Kind<F, [A]>, A>,
    ) => Generator<Eff, R, any>,
  ): Kind<F, [R]>;

  liftM<A, B>(f: (a: A) => B): (fa: Kind<F, [A]>) => Kind<F, [B]>;
}

export type MonadRequirements<F> = Pick<
  Monad<F>,
  'flatMap_' | 'pure' | 'tailRecM_'
> &
  Partial<Monad<F>>;
export const Monad = Object.freeze({
  of: <M>(M: MonadRequirements<M>): Monad<M> => {
    const apply: Apply<M> = Apply.of<M>({
      map_: (fa, f) => M.flatMap_(fa, a => M.pure(f(a))),
      ap_: (ff, fa) => M.flatMap_(ff, f => apply.map_(fa, a => f(a))),
      map2_:
        <A, B>(fa: Kind<M, [A]>, fb: Kind<M, [B]>) =>
        <C>(f: (a: A, b: B) => C) =>
          M.flatMap_(fa, a => apply.map_(fb, b => f(a, b))),
      ...M,
    });
    const flatMap = FlatMap.of({ ...apply, ...M });
    const applicative = Applicative.of({ ...apply, ...M });

    const self: Monad<M> = { ...flatMap, ...applicative, ...M } as any;
    self.do = Monad.Do(self);
    self.liftM = f => fa => self.flatMap_(fa, a => self.pure(f(a)));
    return self;
  },

  get Eval(): StackSafeMonad<EvalF> {
    return StackSafeMonad.Eval;
  },

  get Array(): Monad<ArrayF> {
    return arrayMonad();
  },

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
          const cont = (val: any): Kind<F, [R]> => run(iterator.next(val));

          const run = (
            state: IteratorYieldResult<Eff> | IteratorReturnResult<R>,
          ): Kind<F, [R]> =>
            state.done
              ? F.pure(state.value)
              : F.flatMap_((state.value as Eff).effect, cont);

          return run(state);
        }),
      );
    };
  },
});

export class GenKind<FA, A> {
  public constructor(public readonly effect: FA) {}

  public *[Symbol.iterator](): Generator<GenKind<FA, A>, A, any> {
    return yield this;
  }
}

function adapter<F, A>(fa: Kind<F, [A]>): GenKind<Kind<F, [A]>, A> {
  return new GenKind(fa);
}

// -- HKT

export interface MonadF extends TyK<[unknown]> {
  [$type]: Monad<TyVar<this, 0>>;
}
