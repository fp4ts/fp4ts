// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Monoid, None, Option } from '@fp4ts/cats';

export const firstOption = <A>(): Monoid<Option<A>> =>
  Monoid.of<Option<A>>({
    empty: None,
    combine_: (x, y) => x.orElse(() => y),
    combineEval_: (x, ey) => x.orElseEval(ey),
  });

export const lastOption = <A>(): Monoid<Option<A>> =>
  Monoid.of<Option<A>>({
    empty: None,
    combine_: (x, y) => y.orElse(() => x),
  });
