// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe } from '@fp4ts/core';
import { FlatMap } from '@fp4ts/cats-core';
import {
  Kleisli,
  Left,
  None,
  Option,
  Right,
  Some,
} from '@fp4ts/cats-core/lib/data';
import { IsEq } from '@fp4ts/cats-test-kit';

import { ApplyLaws } from './apply-laws';

export interface FlatMapLaws<F> extends ApplyLaws<F> {
  flatMapAssociativity: <A, B, C>(
    fa: Kind<F, [A]>,
    f: (a: A) => Kind<F, [B]>,
    g: (b: B) => Kind<F, [C]>,
  ) => IsEq<Kind<F, [C]>>;

  flatMapConsistentApply: <A, B>(
    ff: Kind<F, [(a: A) => B]>,
    fa: Kind<F, [A]>,
  ) => IsEq<Kind<F, [B]>>;

  kleisliAssociativity: <A, B, C, D>(
    a: A,
    f: (a: A) => Kind<F, [B]>,
    g: (a: B) => Kind<F, [C]>,
    h: (a: C) => Kind<F, [D]>,
  ) => IsEq<Kind<F, [D]>>;

  tailRecMConsistentFlatMap: <A>(
    a: A,
    f: (a: A) => Kind<F, [A]>,
  ) => IsEq<Kind<F, [A]>>;

  flatMapFromTailRecMConsistency: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Kind<F, [B]>,
  ) => IsEq<Kind<F, [B]>>;
}

export const FlatMapLaws = <F>(F: FlatMap<F>): FlatMapLaws<F> => ({
  ...ApplyLaws(F),

  flatMapAssociativity: <A, B, C>(
    fa: Kind<F, [A]>,
    f: (a: A) => Kind<F, [B]>,
    g: (b: B) => Kind<F, [C]>,
  ): IsEq<Kind<F, [C]>> =>
    new IsEq(
      pipe(fa, F.flatMap(f), F.flatMap(g)),
      F.flatMap_(fa, a => F.flatMap_(f(a), g)),
    ),

  flatMapConsistentApply: <A, B>(
    ff: Kind<F, [(a: A) => B]>,
    fa: Kind<F, [A]>,
  ): IsEq<Kind<F, [B]>> =>
    new IsEq(
      F.ap_(ff, fa),
      F.flatMap_(ff, f => F.map_(fa, a => f(a))),
    ),

  kleisliAssociativity: <A, B, C, D>(
    a: A,
    f: (a: A) => Kind<F, [B]>,
    g: (a: B) => Kind<F, [C]>,
    h: (a: C) => Kind<F, [D]>,
  ): IsEq<Kind<F, [D]>> => {
    const [kf, kg, kh] = [Kleisli(f), Kleisli(g), Kleisli(h)];

    const l = kf['>=>'](F)(kg)['>=>'](F)(kh).run(a);
    const r = kf['>=>'](F)(kg['>=>'](F)(kh)).run(a);

    return new IsEq(l, r);
  },

  tailRecMConsistentFlatMap: <A>(
    a: A,
    f: (a: A) => Kind<F, [A]>,
  ): IsEq<Kind<F, [A]>> => {
    const loop = (n: number) =>
      F.tailRecM<[A, number]>([a, n])(([a0, i]) =>
        i > 0 ? F.map_(f(a0), a1 => Left([a1, i - 1])) : F.map_(f(a0), Right),
      );

    return new IsEq(loop(1), F.flatMap_(loop(0), f));
  },

  flatMapFromTailRecMConsistency: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Kind<F, [B]>,
  ): IsEq<Kind<F, [B]>> => {
    const tailRecMFlatMap = F.tailRecM(None as Option<A>)(opt =>
      opt.fold(
        () => F.map_(fa, a => Left(Some(a))),
        a => F.map_(f(a), Right),
      ),
    );

    return new IsEq(F.flatMap_(fa, f), tailRecMFlatMap);
  },
});
