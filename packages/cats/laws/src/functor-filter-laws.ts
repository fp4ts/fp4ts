// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind } from '@fp4ts/core';
import { FunctorFilter } from '@fp4ts/cats-core';
import { None, Option, Some } from '@fp4ts/cats-core/lib/data';
import { IsEq } from '@fp4ts/cats-test-kit';

import { FunctorLaws } from './functor-laws';

export const FunctorFilterLaws = <F>(
  F: FunctorFilter<F>,
): FunctorFilterLaws<F> => ({
  ...FunctorLaws(F),

  mapFilterComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f: (a: A) => Option<B>,
    g: (b: B) => Option<C>,
  ): IsEq<Kind<F, [B]>> => {
    const lhs = F.mapFilter_(F.mapFilter_(fa, f), g);
    const rhs = F.mapFilter_(fa, a => f(a).flatMap(g));
    return new IsEq(lhs, rhs);
  },

  mapFilterMapConsistency: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
  ): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.mapFilter_(fa, a => Some(f(a))),
      F.map_(fa, f),
    ),

  collectConsistentWithMapFilter: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Option<B>,
  ): IsEq<Kind<F, [B]>> => new IsEq(F.collect_(fa, f), F.mapFilter_(fa, f)),

  flattenOptionConsistentWithMapFilter: <A>(
    ffa: Kind<F, [Option<A>]>,
  ): IsEq<Kind<F, [A]>> =>
    new IsEq(F.flattenOption(ffa), F.mapFilter_(ffa, id)),

  filterConsistentWithMapFilter: <A>(
    fa: Kind<F, [A]>,
    p: (a: A) => boolean,
  ): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.filter_(fa, p),
      F.mapFilter_(fa, a => (p(a) ? Some(a) : None)),
    ),

  filterNotConsistentWithFilter: <A>(
    fa: Kind<F, [A]>,
    p: (a: A) => boolean,
  ): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.filterNot_(fa, p),
      F.filter_(fa, a => !p(a)),
    ),
});

export interface FunctorFilterLaws<F> extends FunctorLaws<F> {
  mapFilterComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f: (a: A) => Option<B>,
    g: (b: B) => Option<C>,
  ) => IsEq<Kind<F, [B]>>;

  mapFilterMapConsistency: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
  ) => IsEq<Kind<F, [A]>>;

  collectConsistentWithMapFilter: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Option<B>,
  ) => IsEq<Kind<F, [B]>>;

  flattenOptionConsistentWithMapFilter: <A>(
    ffa: Kind<F, [Option<A>]>,
  ) => IsEq<Kind<F, [A]>>;

  filterConsistentWithMapFilter: <A>(
    fa: Kind<F, [A]>,
    p: (a: A) => boolean,
  ) => IsEq<Kind<F, [A]>>;

  filterNotConsistentWithFilter: <A>(
    fa: Kind<F, [A]>,
    p: (a: A) => boolean,
  ) => IsEq<Kind<F, [A]>>;
}
