// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '@fp4ts/cats-kernel';
import { IsEq } from '@fp4ts/cats-test-kit';

export const EqLaws = <A>(E: Eq<A>) => ({
  reflexivityEq: (x: A): IsEq<A> => new IsEq(x, x),

  symmetricEq: (x: A, y: A): IsEq<boolean> =>
    new IsEq(E.equals(x, y), E.equals(y, x)),

  antiSymmetricEq: (x: A, y: A, f: (a: A) => A): IsEq<boolean> =>
    new IsEq(E.notEquals(x, y) || E.equals(f(x), f(y)), true),

  transitivityEq: (x: A, y: A, z: A): IsEq<boolean> =>
    new IsEq(!(E.equals(x, y) && E.equals(y, x)) || E.equals(x, z), true),
});

export interface EqLaws<A> {
  reflexivityEq(x: A): IsEq<A>;

  symmetricEq(x: A, y: A): IsEq<boolean>;

  antiSymmetricEq(x: A, y: A, f: (a: A) => A): IsEq<boolean>;

  transitivityEq(x: A, y: A, z: A): IsEq<boolean>;
}
