// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id } from '@fp4ts/core';
import { Functor } from '@fp4ts/cats';
import { Profunctor } from '@fp4ts/cats-profunctor';
import { POptic } from './optics';

export type PIso<S, T, A, B> = <F, P>(
  F: Functor<F>,
  P: Profunctor<P>,
) => POptic<F, P, S, T, A, B>;
export type Iso<S, A> = PIso<S, S, A, A>;

export function iso<A>(): Iso<A, A>;
export function iso<S, T, A, B>(
  get: (s: S) => A,
  reverseGet: (b: B) => T,
): PIso<S, T, A, B>;
export function iso(...args: any[]): Iso<any, any> {
  return args.length === 2 ? iso_(args[0], args[1]) : id_();
}
function iso_<S, T, A, B>(
  get: (s: S) => A,
  reverseGet: (b: B) => T,
): PIso<S, T, A, B> {
  return <F, P>(F: Functor<F>, P: Profunctor<P>) =>
    P.dimap(get, F.map(reverseGet));
}

function id_<A>(): Iso<A, A> {
  return () => id;
}
