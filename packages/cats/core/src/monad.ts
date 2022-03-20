// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { HKT, HKT1, Kind, pipe } from '@fp4ts/core';
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

  ifM<A>(
    then: Kind<F, [A]>,
    else_: Kind<F, [A]>,
  ): (fc: Kind<F, [boolean]>) => Kind<F, [A]>;
  ifM_<A>(
    fc: Kind<F, [boolean]>,
    then: Kind<F, [A]>,
    else_: Kind<F, [A]>,
  ): Kind<F, [A]>;
}

export type MonadRequirements<F> = Pick<
  Monad<F>,
  'flatMap_' | 'pure' | 'tailRecM_'
> &
  Partial<Monad<F>>;

function of<M>(M: MonadRequirements<M>): Monad<M>;
function of<M>(M: MonadRequirements<HKT1<M>>): Monad<HKT1<M>> {
  const F = Monad.deriveFlatMap(M);
  const A = Monad.deriveApplicative(M);

  const self: Monad<HKT1<M>> = { ...F, ...A, ...M } as any;
  self.ifM = (t, e) => fc => self.ifM_(fc, t, e);
  self.ifM_ = (fc, t, e) => self.flatMap_(fc, c => (c ? t : e));
  self.do = Monad.Do(self);
  return self;
}

function deriveFunctor<F>(F: MonadRequirements<F>): Functor<F>;
function deriveFunctor<F>(F: MonadRequirements<HKT1<F>>): Functor<HKT1<F>> {
  return Functor.of({
    map_: (fa, f) => F.flatMap_(fa, x => F.pure(f(x))),
    ...F,
  });
}

function deriveApply<F>(F: MonadRequirements<F>): Apply<F>;
function deriveApply<F>(F: MonadRequirements<HKT1<F>>): Apply<HKT1<F>> {
  const self: Apply<HKT1<F>> = Apply.of({
    ap_: (ff, fa) => F.flatMap_(ff, f => self.map_(fa, a => f(a))),
    ...Monad.deriveFunctor(F),
    ...F,
  });
  return self;
}

function deriveApplicative<F>(F: MonadRequirements<F>): Applicative<F>;
function deriveApplicative<F>(
  F: MonadRequirements<HKT1<F>>,
): Applicative<HKT1<F>> {
  return Applicative.of({
    ...Monad.deriveApply(F),
    ...F,
  });
}

function deriveFlatMap<F>(F: MonadRequirements<F>): FlatMap<F>;
function deriveFlatMap<F>(F: MonadRequirements<HKT1<F>>): FlatMap<HKT1<F>> {
  return FlatMap.of({
    ...Monad.deriveApply(F),
    ...F,
  });
}

// from Effect-TS https://github.com/Effect-TS/core/blob/340cdaf66fa233195a65661ab29aa3a9f813763a/packages/core/src/Prelude/DSL/gen.ts#L153
function Do<F>(
  F: Monad<F>,
): <Eff extends GenKind<Kind<F, [any]>, any>, R>(
  f: (
    fa: <A>(fa: Kind<F, [A]>) => GenKind<Kind<F, [A]>, A>,
  ) => Generator<Eff, R, any>,
) => Kind<F, [R]>;
function Do<F>(
  F: Monad<HKT1<F>>,
): <Eff extends GenKind<HKT<F, [any]>, any>, R>(
  f: (
    fa: <A>(fa: HKT<F, [A]>) => GenKind<HKT<F, [A]>, A>,
  ) => Generator<Eff, R, any>,
) => HKT<F, [R]> {
  return function doNotation<Eff extends GenKind<HKT<F, [any]>, any>, R>(
    f: (
      fa: <A>(fa: HKT<F, [A]>) => GenKind<HKT<F, [A]>, A>,
    ) => Generator<Eff, R, any>,
  ): HKT<F, [R]> {
    return pipe(
      F.unit,
      F.flatMap(() => {
        const iterator = f(adapter);
        const state = iterator.next();

        const run = (
          state: IteratorYieldResult<Eff> | IteratorReturnResult<R>,
        ): HKT<F, [R]> =>
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
}

export const Monad = Object.freeze({
  of,
  deriveFunctor,
  deriveApply,
  deriveApplicative,
  deriveFlatMap,

  // -- Generator Based Do notation

  Do,
});

class GenKind<FA, A> {
  public constructor(public readonly effect: FA) {}

  public *[Symbol.iterator](): Generator<GenKind<FA, A>, A, any> {
    return yield this;
  }
}

function adapter<F, A>(fa: Kind<F, [A]>): GenKind<Kind<F, [A]>, A>;
function adapter<F, A>(fa: HKT<F, [A]>): GenKind<HKT<F, [A]>, A>;
function adapter<F, A>(fa: HKT<F, [A]>): GenKind<HKT<F, [A]>, A> {
  return new GenKind(fa);
}
