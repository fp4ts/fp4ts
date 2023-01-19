// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, instance, Kind } from '@fp4ts/core';

export interface Refining<S> extends Base<S> {
  refine<A, B extends A>(
    f: (a: A) => a is B,
  ): (sa: Kind<S, [A]>) => Kind<S, [B]>;
  refine_<A, B extends A>(sa: Kind<S, [A]>, f: (a: A) => a is B): Kind<S, [B]>;
}

export type RefiningRequirements<S> = Pick<Refining<S>, 'refine_'> &
  Partial<Refining<S>>;
export const Refining = Object.freeze({
  of: <S>(S: RefiningRequirements<S>): Refining<S> =>
    instance<Refining<S>>({
      refine: r => fa => S.refine_(fa, r),
      ...S,
    }),
});
