// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, id, HKT1 } from '@fp4ts/core';
import { Functor, FunctorRequirements } from './functor';
import { Option, Some, None } from './data/option';

/**
 * @category Type Class
 */
export interface FunctorFilter<F> extends Functor<F> {
  readonly mapFilter: <A, B>(
    f: (a: A) => Option<B>,
  ) => (fa: Kind<F, [A]>) => Kind<F, [B]>;
  readonly mapFilter_: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Option<B>,
  ) => Kind<F, [B]>;

  readonly collect: <A, B>(
    f: (a: A) => Option<B>,
  ) => (fa: Kind<F, [A]>) => Kind<F, [B]>;
  readonly collect_: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Option<B>,
  ) => Kind<F, [B]>;

  readonly flattenOption: <A>(ffa: Kind<F, [Option<A>]>) => Kind<F, [A]>;

  readonly filter: <A>(
    p: (a: A) => boolean,
  ) => (fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly filter_: <A>(fa: Kind<F, [A]>, p: (a: A) => boolean) => Kind<F, [A]>;

  readonly filterNot: <A>(
    p: (a: A) => boolean,
  ) => (fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly filterNot_: <A>(
    fa: Kind<F, [A]>,
    p: (a: A) => boolean,
  ) => Kind<F, [A]>;
}

export type FunctorFilterRequirements<F> = Pick<
  FunctorFilter<F>,
  'mapFilter_'
> &
  FunctorRequirements<F> &
  Partial<FunctorFilter<F>>;

function of<F>(F: FunctorFilterRequirements<F>): FunctorFilter<F>;
function of<F>(F: FunctorFilterRequirements<HKT1<F>>): FunctorFilter<HKT1<F>> {
  const self: FunctorFilter<HKT1<F>> = {
    mapFilter: f => fa => self.mapFilter_(fa, f),

    collect: f => fa => self.mapFilter_(fa, f),
    collect_: (fa, f) => self.mapFilter_(fa, f),

    flattenOption: fa => self.collect_(fa, id),

    filter: f => fa => self.filter_(fa, f),
    filter_: (fa, p) => self.collect_(fa, x => (p(x) ? Some(x) : None)),

    filterNot: f => fa => self.filterNot_(fa, f),
    filterNot_: (fa, p) => self.filter_(fa, x => !p(x)),

    ...Functor.of(F),
    ...F,
  };
  return self;
}

export const FunctorFilter = Object.freeze({
  of,
});
