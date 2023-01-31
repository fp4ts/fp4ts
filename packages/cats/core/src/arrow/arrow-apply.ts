// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind, pipe, tupled } from '@fp4ts/core';
import { function1ArrowApply, Function1F } from '../instances/function';
import { GenKind, Monad } from '../monad';
import { Arrow, ArrowRequirements } from './arrow';
import { ArrowMonad } from './arrow-monad';

export interface ArrowApply<F> extends Arrow<F> {
  app<A, B>(): Kind<F, [[Kind<F, [A, B]>, A], B]>;

  // -- Do Notations

  proc<I, R>(f: (i: I) => ArrowMonad<F, R>): Kind<F, [I, R]>;
  do<Eff extends GenKind<ArrowMonad<F, any>, any>, R>(
    f: (
      fa: <A, B>(fa: Kind<F, [A, B]>, a: A) => GenKind<ArrowMonad<F, B>, B>,
    ) => Generator<Eff, R, any>,
  ): ArrowMonad<F, R>;

  Monad: Monad<$<F, [void]>>;
}

export type ArrowApplyRequirements<F> = Pick<ArrowApply<F>, 'app'> &
  ArrowRequirements<F> &
  Partial<ArrowApply<F>>;
export const ArrowApply = Object.freeze({
  of: <F>(F: ArrowApplyRequirements<F>): ArrowApply<F> => {
    const self: ArrowApply<F> = { ...Arrow.of(F), ...F } as any;

    self.Monad = ArrowMonad.Monad(self);
    self.proc = proc(self);
    self.do = Do(self);

    return self;
  },

  get Function1(): ArrowApply<Function1F> {
    return function1ArrowApply();
  },
});

function proc<F>(F: ArrowApply<F>) {
  return <I, R>(f: (i: I) => ArrowMonad<F, R>): Kind<F, [I, R]> =>
    pipe(
      F.lift((i: I) => tupled(f(i), undefined)),
      F.andThen(F.app()),
    );
}

function Do<F>(F: ArrowApply<F>) {
  const M: Monad<$<F, [void]>> = F.Monad;

  return function doNotation<Eff extends GenKind<ArrowMonad<F, any>, any>, R>(
    f: (
      fa: <A, B>(fa: Kind<F, [A, B]>, a: A) => GenKind<ArrowMonad<F, B>, B>,
    ) => Generator<Eff, R, any>,
  ): ArrowMonad<F, R> {
    return M.do(_ =>
      f(<A, B>(fa: Kind<F, [A, B]>, a: A) =>
        pipe(
          F.lift<void, [Kind<F, [A, B]>, A]>(() => tupled(fa, a)),
          F.andThen(F.app<A, B>()),
          _,
        ),
      ),
    );
  };
}
