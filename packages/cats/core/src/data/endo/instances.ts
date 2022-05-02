// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy, lazyVal } from '@fp4ts/core';
import { AndThen } from '../and-then';
import { MonoidK } from '../../monoid-k';

import type { Endo, EndoF } from './endo';

export const endoMonoidK: Lazy<MonoidK<EndoF>> = lazyVal(() =>
  MonoidK.of({
    emptyK:
      <A>() =>
      (x: A) =>
        x,
    combineK_: <A>(x: Endo<A>, y: Lazy<Endo<A>>) =>
      AndThen(x).compose((x: A) => y()(x)),
  }),
);
