// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Ord } from '@fp4ts/cats-kernel';
import { IsEq } from '@fp4ts/cats-test-kit';
import { EqLaws } from './eq-laws';

export const OrdLaws = <A>(O: Ord<A>) => ({
  ...EqLaws(O),

  reflexivityLT: (x: A): boolean => O.lte(x, x) === true,
  reflexivityGT: (x: A): boolean => O.gte(x, x) === true,

  comparabilityOrd: (x: A, y: A): boolean =>
    O.lte(x, y) || O.lte(y, x) === true,

  transitivityOrd: (x: A, y: A, z: A): boolean =>
    !(O.lte(x, y) && O.lte(y, z)) || O.lte(x, z) === true,

  antisymmetryOrd: (x: A, y: A): boolean =>
    !(O.lte(x, y) && O.lte(y, x)) || O.equals(x, y) === true,

  minOrd: (x: A, y: A): IsEq<A> => new IsEq(O.min(x, y), O.lte(x, y) ? x : y),
  maxOrd: (x: A, y: A): IsEq<A> => new IsEq(O.max(x, y), O.gte(x, y) ? x : y),
});
