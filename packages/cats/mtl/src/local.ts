// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { instance, Kind } from '@fp4ts/core';
import { Ask, AskRequirements } from './ask';

export interface Local<F, R> extends Ask<F, R> {
  local(f: (r: R) => R): <A>(fa: Kind<F, [A]>) => Kind<F, [A]>;
  local_<A>(fa: Kind<F, [A]>, f: (r: R) => R): Kind<F, [A]>;

  scope(r: R): <A>(fa: Kind<F, [A]>) => Kind<F, [A]>;
  scope_<A>(fa: Kind<F, [A]>, r: R): Kind<F, [A]>;
}

export type LocalRequirements<F, R> = Pick<Local<F, R>, 'local_'> &
  AskRequirements<F, R> &
  Partial<Local<F, R>>;
export const Local = Object.freeze({
  of: <F, R>(F: LocalRequirements<F, R>): Local<F, R> => {
    const self: Local<F, R> = instance<Local<F, R>>({
      local: f => fa => self.local_(fa, f),

      scope: r => fa => self.scope_(fa, r),
      scope_: (fa, r) => self.local_(fa, () => r),

      ...Ask.of(F),
      ...F,
    });
    return self;
  },
});
