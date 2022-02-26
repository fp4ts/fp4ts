// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { CoflatMap, CoflatMapRequirements } from './coflat-map';

export interface Comonad<F> extends CoflatMap<F> {
  extract<A>(fa: Kind<F, [A]>): A;
}

export type ComonadRequirements<F> = Pick<Comonad<F>, 'extract'> &
  CoflatMapRequirements<F> &
  Partial<Comonad<F>>;
export const Comonad = Object.freeze({
  of: <F>(F: ComonadRequirements<F>): Comonad<F> => ({
    ...CoflatMap.of(F),
    ...F,
  }),
});
