// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Distributive } from '@fp4ts/cats-core';
import { Identity } from '@fp4ts/cats-core/lib/data';
import { IsEq } from '@fp4ts/cats-test-kit';
import { FunctorLaws } from './functor-laws';

export const DistributiveLaws = <F>(F: Distributive<F>) => ({
  ...FunctorLaws(F),

  distributiveIdentity: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
  ): IsEq<Kind<F, [B]>> =>
    new IsEq(F.distribute_(Identity.Functor)(fa, F.map(f)), F.map_(fa, f)),

  consequenceIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(F.consequence(Identity.Functor)(fa), fa),

  consequenceTwiceIsId:
    <G>(G: Distributive<G>) =>
    <A>(fga: Kind<F, [Kind<G, [A]>]>): IsEq<Kind<F, [Kind<G, [A]>]>> =>
      new IsEq(F.consequence(G)(G.consequence(F)(fga)), fga),
});
