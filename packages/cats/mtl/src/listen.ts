// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { instance, Kind } from '@fp4ts/core';
import { Tell, TellRequirements } from './tell';

export interface Listen<F, W> extends Tell<F, W> {
  listen<A>(fa: Kind<F, [A]>): Kind<F, [[W, A]]>;
}

export type ListenRequirements<F, W> = Pick<Listen<F, W>, 'listen'> &
  TellRequirements<F, W> &
  Partial<Listen<F, W>>;
export const Listen = Object.freeze({
  of: <F, W>(F: ListenRequirements<F, W>): Listen<F, W> => {
    const self: Listen<F, W> = instance<Listen<F, W>>({
      ...Tell.of(F),
      ...F,
    });
    return self;
  },
});
