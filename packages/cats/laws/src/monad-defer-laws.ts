// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { MonadDefer } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';

import { MonadLaws } from './monad-laws';
import { DeferLaws } from './defer-laws';

export const MonadDeferLaws = <F>(F: MonadDefer<F>) => ({
  ...MonadLaws(F),
  ...DeferLaws(F),

  monadDeferDelayIsPure: <A>(a: A) =>
    new IsEq(
      F.delay(() => a),
      F.pure(a),
    ),

  monadDeferDelayDoesNotEvaluate: (): boolean => {
    let evaluated = false;
    const delayed = F.delay(() => {
      evaluated = true;
    });
    return evaluated === false;
  },

  monadDeferMapIsLazy: <A>(fa: Kind<F, [A]>): boolean => {
    let evaluated = false;
    F.map_(fa, _ => {
      evaluated = true;
    });
    return evaluated === false;
  },

  monadDeferFlatMapIsLazy: <A>(fa: Kind<F, [A]>): boolean => {
    let evaluated = false;
    F.flatMap_(fa, _ => {
      evaluated = true;
      return F.unit;
    });
    return evaluated === false;
  },

  monadDeferMapStackSafety: (): IsEq<Kind<F, [number]>> => {
    let fa = F.pure(0);
    const size = 50_000;
    for (let i = 0; i < size; i++) {
      fa = F.map_(fa, x => x + 1);
    }
    return new IsEq(fa, F.pure(size));
  },

  monadDeferLeftBindStackSafety: (): IsEq<Kind<F, [number]>> => {
    let fa = F.pure(0);
    const size = 50_000;
    for (let i = 0; i < size; i++) {
      fa = F.flatMap_(fa, x => F.pure(x + 1));
    }
    return new IsEq(fa, F.pure(size));
  },

  monadDeferRightBindStackSafety: (): IsEq<Kind<F, [number]>> => {
    const size = 50_000;
    const loop = (i: number): Kind<F, [number]> =>
      i >= size ? F.pure(size) : F.flatMap_(F.pure(i + 1), loop);
    return new IsEq(loop(0), F.pure(size));
  },
});
