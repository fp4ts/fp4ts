// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id } from '@fp4ts/core';
import { Functor, Profunctor } from '@fp4ts/cats';
import { POptic } from './optics';

export type PIso<S, T, A, B> = <F, P>(
  F: Functor<F>,
  P: Profunctor<P>,
) => POptic<F, P, S, T, A, B>;
export type Iso<S, A> = PIso<S, S, A, A>;

export function iso<S, T, A, B>(
  get: (s: S) => A,
  reverseGet: (b: B) => T,
): PIso<S, T, A, B> {
  return <F, P>(F: Functor<F>, P: Profunctor<P>) =>
    P.dimap(get, F.map(reverseGet));
}

export function id_<A>(): Iso<A, A> {
  return () => id;
}
