// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { flow, tupled } from '@fp4ts/core';
import { Functor, Strong } from '@fp4ts/cats';
import { Optic, POptic } from './optics';

export type PLens<S, T, A, B> = <F, P>(
  F: Functor<F>,
  P: Strong<P>,
) => POptic<F, P, S, T, A, B>;
export type Lens<S, A> = PLens<S, S, A, A>;

export function Lens<S, T, A, B>(
  get: (s: S) => A,
  replace: (b: B) => (s: S) => T,
): PLens<S, T, A, B> {
  return <F, P>(F: Functor<F>, P: Strong<P>): POptic<F, P, S, T, A, B> =>
    flow(
      P.first<S>(),
      P.dimap(
        s => tupled(get(s), s),
        ([fb, s]) => F.map_(fb, b => replace(b)(s)),
      ),
    );
}

export function nth<S extends unknown[]>(): <I extends keyof S>(
  i: I,
) => Lens<S, S[I]> {
  return <I extends keyof S>(i: I) =>
    <F, P>(F: Functor<F>, P: Strong<P>): Optic<F, P, S, S[I]> =>
      flow(
        P.first<S>(),
        P.dimap(
          s => tupled(s[i], s),
          ([fsi, s]) =>
            F.map_(fsi, si => s.map((x, idx) => (idx === i ? si : x)) as S),
        ),
      );
}

export function fst<A, C, B = A>(): PLens<[A, C], [B, C], A, B> {
  return <F, P>(
    F: Functor<F>,
    P: Strong<P>,
  ): POptic<F, P, [A, C], [B, C], A, B> =>
    flow(
      P.first<C>(),
      P.rmap(([fb, c]) => F.map_(fb, b => tupled(b, c))),
    );
}

export function snd<C, A, B = A>(): PLens<[C, A], [C, B], A, B> {
  return <F, P>(
    F: Functor<F>,
    P: Strong<P>,
  ): POptic<F, P, [C, A], [C, B], A, B> =>
    flow(
      P.second<C>(),
      P.rmap(([c, fb]) => F.map_(fb, b => tupled(c, b))),
    );
}

export function fromProp<S>(): <K extends keyof S>(k: K) => Lens<S, S[K]> {
  return <K extends keyof S>(k: K) =>
    <F, P>(F: Functor<F>, P: Strong<P>): Optic<F, P, S, S[K]> =>
      flow(
        P.first<S>(),
        P.dimap(
          s => tupled(s[k], s),
          ([fsk, s]) => F.map_(fsk, sk => ({ ...s, [k]: sk })),
        ),
      );
}
