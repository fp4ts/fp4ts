// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Applicative } from '../applicative';
import { Contravariant } from '../contravariant';
import { EqK } from '../eq-k';
import { Foldable } from '../foldable';
import { Functor } from '../functor';
import { Traversable } from '../traversable';
import { FunctorFilter } from '../functor-filter';
import { TraversableFilter } from '../traversable-filter';
import { Option } from './option';

/**
 * Coproduct of the two functors.
 */
export type Coproduct<F, G, A> = Coproduct_<F, G, A>;
export const Coproduct = function () {};

abstract class Coproduct_<F, G, out A> {
  /**
   * Like functor's `map`, but on either of the corresponding functor values.
   */
  public abstract transform<B>(
    f: (fa: Kind<F, [A]>) => Kind<F, [B]>,
    g: (ga: Kind<G, [A]>) => Kind<G, [B]>,
  ): Coproduct<F, G, B>;

  public abstract eliminate<B>(
    f: (fa: Kind<F, [A]>) => B,
    g: (ga: Kind<G, [A]>) => B,
  ): B;
}

class Inl<F, G, A> extends Coproduct_<F, G, A> {
  public constructor(public readonly fa: Kind<F, [A]>) {
    super();
  }

  public transform<B>(
    f: (fa: Kind<F, [A]>) => Kind<F, [B]>,
    g: (fa: Kind<G, [A]>) => Kind<G, [B]>,
  ): Coproduct<F, G, B> {
    return new Inl(f(this.fa));
  }

  public eliminate<B>(
    f: (fa: Kind<F, [A]>) => B,
    g: (ga: Kind<G, [A]>) => B,
  ): B {
    return f(this.fa);
  }
}

class Inr<F, G, A> extends Coproduct_<F, G, A> {
  public constructor(public readonly ga: Kind<G, [A]>) {
    super();
  }

  public transform<B>(
    f: (fa: Kind<F, [A]>) => Kind<F, [B]>,
    g: (ga: Kind<G, [A]>) => Kind<G, [B]>,
  ): Coproduct<F, G, B> {
    return new Inr(g(this.ga));
  }

  public eliminate<B>(
    f: (fa: Kind<F, [A]>) => B,
    g: (ga: Kind<G, [A]>) => B,
  ): B {
    return g(this.ga);
  }
}

Coproduct.Inl = <F, G, A>(fa: Kind<F, [A]>): Coproduct<F, G, A> => new Inl(fa);
Coproduct.Inr = <F, G, A>(ga: Kind<G, [A]>): Coproduct<F, G, A> => new Inr(ga);

Coproduct.Eq = <F, G, A>(F: Eq<Kind<F, [A]>>, G: Eq<Kind<G, [A]>>) =>
  Eq.of<Coproduct<F, G, A>>({
    equals: (l, r) => {
      if (l === r) return true;
      if (l instanceof Inl && r instanceof Inl) return F.equals(l.fa, r.fa);
      if (l instanceof Inr && r instanceof Inr) return G.equals(l.ga, r.ga);
      return false;
    },
  });

Coproduct.EqK = <F, G>(F: EqK<F>, G: EqK<G>) =>
  EqK.of<$<CoproductF, [F, G]>>({
    liftEq: A => Coproduct.Eq(F.liftEq(A), G.liftEq(A)),
  });

Coproduct.Functor = <F, G>(F: Functor<F>, G: Functor<G>) =>
  Functor.of<$<CoproductF, [F, G]>>({
    map_: (fga, f) => fga.transform(F.map(f), G.map(f)),
  });

Coproduct.FunctorFilter = <F, G>(F: FunctorFilter<F>, G: FunctorFilter<G>) =>
  FunctorFilter.of<$<CoproductF, [F, G]>>({
    ...Coproduct.Functor(F, G),
    mapFilter_: (fga, f) => fga.transform(F.mapFilter(f), G.mapFilter(f)),
    filter_: <A>(fga: Coproduct<F, G, A>, f: (a: A) => boolean) =>
      fga.transform(F.filter(f), G.filter(f)),
    filterNot_: (fga, f) => fga.transform(F.filterNot(f), G.filterNot(f)),
  });

Coproduct.Contravariant = <F, G>(F: Contravariant<F>, G: Contravariant<G>) =>
  Contravariant.of<$<CoproductF, [F, G]>>({
    contramap_: (fga, f) => fga.transform(F.contramap(f), G.contramap(f)),
  });

Coproduct.Foldable = <F, G>(F: Foldable<F>, G: Foldable<G>) =>
  Foldable.of<$<CoproductF, [F, G]>>({
    foldMap_:
      <M>(M: Monoid<M>) =>
      <A>(fga: Coproduct<F, G, A>, f: (a: A) => M) =>
        fga.eliminate(F.foldMap(M)(f), G.foldMap(M)(f)),

    foldLeft_: (fga, z, f) => fga.eliminate(F.foldLeft(z, f), G.foldLeft(z, f)),
    foldRight_: (fga, ez, f) =>
      fga.eliminate(F.foldRight(ez, f), G.foldRight(ez, f)),

    size: fga => fga.eliminate(F.size, G.size),
    isEmpty: fga => fga.eliminate(F.isEmpty, G.isEmpty),
    nonEmpty: fga => fga.eliminate(F.nonEmpty, G.nonEmpty),
    all_: (fga, f) => fga.eliminate(F.all(f), G.all(f)),
    any_: (fga, f) => fga.eliminate(F.any(f), G.any(f)),
    count_: (fga, f) => fga.eliminate(F.count(f), G.count(f)),
    toList: fga => fga.eliminate(F.toList, G.toList),
    view: fga => fga.eliminate(F.view, G.view),
  });

Coproduct.Traversable = <F, G>(F: Traversable<F>, G: Traversable<G>) =>
  Traversable.of<$<CoproductF, [F, G]>>({
    ...Coproduct.Functor(F, G),
    ...Coproduct.Foldable(F, G),
    traverse_:
      <H>(H: Applicative<H>) =>
      <A, B>(fga: Coproduct<F, G, A>, f: (a: A) => Kind<H, [B]>) =>
        fga.eliminate<Kind<H, [Coproduct<F, G, B>]>>(
          // prettier-ignore
          fa => H.map_(F.traverse_(H)(fa, f), (Coproduct.Inl)<F, G, B>),
          // prettier-ignore
          ga => H.map_(G.traverse_(H)(ga, f), (Coproduct.Inr)<F, G, B>),
        ),
  });

Coproduct.TraversableFilter = <F, G>(
  F: TraversableFilter<F>,
  G: TraversableFilter<G>,
) =>
  TraversableFilter.of<$<CoproductF, [F, G]>>({
    ...Coproduct.Traversable(F, G),
    traverseFilter_:
      <H>(H: Applicative<H>) =>
      <A, B>(fga: Coproduct<F, G, A>, f: (a: A) => Kind<H, [Option<B>]>) =>
        fga.eliminate<Kind<H, [Coproduct<F, G, B>]>>(
          // prettier-ignore
          fa => H.map_(F.traverseFilter_(H)(fa, f), (Coproduct.Inl)<F, G, B>),
          // prettier-ignore
          ga => H.map_(G.traverseFilter_(H)(ga, f), (Coproduct.Inr)<F, G, B>),
        ),
  });

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface CoproductF extends TyK<[unknown, unknown, unknown]> {
  [$type]: Coproduct<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
