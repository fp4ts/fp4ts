// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { instance, Kind } from '@fp4ts/core';
import { Functor, FunctorRequirements } from '@fp4ts/cats-core';

export interface Tell<F, W> extends Functor<F> {
  tell(w: W): Kind<F, [void]>;

  writer(w: W): <A>(a: A) => Kind<F, [A]>;
  writer_<A>(a: A, w: W): Kind<F, [A]>;
}

export type TellRequirements<F, W> = Pick<Tell<F, W>, 'tell'> &
  FunctorRequirements<F> &
  Partial<Tell<F, W>>;
export const Tell = Object.freeze({
  of: <F, W>(F: TellRequirements<F, W>): Tell<F, W> => {
    const self: Tell<F, W> = instance<Tell<F, W>>({
      writer: w => a => self.writer_(a, w),
      writer_: (a, w) => F.map_(F.tell(w), () => a),
      ...Functor.of(F),
      ...F,
    });

    return self;
  },
});
