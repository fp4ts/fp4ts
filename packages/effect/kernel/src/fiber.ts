// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind, pipe } from '@fp4ts/core';
import { Outcome } from './outcome';
import { MonadCancel } from './monad-cancel';
import { Spawn } from './spawn';

export abstract class Fiber<F, E, A> {
  public abstract readonly join: Kind<F, [Outcome<F, E, A>]>;
  public abstract readonly cancel: Kind<F, [void]>;

  public joinWith<B>(
    this: Fiber<F, E, B>,
    F: MonadCancel<F, E>,
  ): (onCancel: Kind<F, [B]>) => Kind<F, [B]> {
    return onCancel =>
      pipe(
        this.join,
        F.flatMap(oc => oc.fold(() => onCancel, F.throwError, id)),
      );
  }

  public joinWithNever(F: Spawn<F, E>): Kind<F, [A]> {
    return this.joinWith(F)(F.never);
  }
}
