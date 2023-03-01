// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Bifunctor, Contravariant, Function1F } from '@fp4ts/cats';
import { $, F1, Kind } from '@fp4ts/core';

import type { Fold, IndexedFold, IndexPreservingFold } from '../fold';
import type { Getter, IndexedGetter, IndexPreservingGetter } from '../getter';
import type { PIso } from '../iso';
import type { IndexedPLens, IndexPreservingPLens, PLens } from '../lens';
import type { PPrism } from '../prism';
import type { Review } from '../review';
import { Settable } from './settable';
import type {
  IndexedPSetter,
  IndexPreservingPSetter,
  PSetter,
} from '../setter';
import type {
  IndexedPTraversal,
  IndexPreservingPTraversal,
  PTraversal,
} from '../traversal';

import { Optic } from './optic';
import { Function1Indexable, Indexable, IndexedIndexable } from './indexable';
import { IndexedF, reindex } from './indexed';
import { IndexPreservingOptic } from './index-preserving-optic';

export class IndexedOptic<out I, in S, out T, out A, in B> extends Optic<
  S,
  T,
  A,
  B
> {
  readonly I!: () => I;

  public constructor(
    runOptic: <F, P, RepF, CorepF>(
      F: Contravariant<F> & Settable<F>,
      P: Indexable<P, I, RepF, CorepF> & Bifunctor<P>,
    ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => (s: S) => Kind<F, [T]>,
  ) {
    super(runOptic as any);
  }

  override readonly runOptic!: <F, P>(
    F: Contravariant<F> & Settable<F>,
    P: Indexable<P, I, any, any> & Bifunctor<P>,
  ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => (s: S) => Kind<F, [T]>;

  override compose<S, T, A, B, C, D>(
    this: PIso<S, T, A, B>,
    that: PIso<A, B, C, D>,
  ): PIso<S, T, C, D>;
  override compose<I, S, T, A, B, C, D>(
    this: IndexedPLens<I, S, T, A, B>,
    that: IndexPreservingPLens<A, B, C, D>,
  ): IndexedPLens<I, S, T, C, D>;
  override compose<S, T, A, B, C, D>(
    this: PPrism<S, T, A, B>,
    that: PPrism<A, B, C, D>,
  ): PPrism<S, T, C, D>;
  override compose<S, T, A, B, C, D>(
    this: PLens<S, T, A, B>,
    that: PLens<A, B, C, D>,
  ): PLens<S, T, C, D>;
  override compose<I, S, T, A, B, C, D>(
    this: IndexedPTraversal<I, S, T, A, B>,
    that: IndexPreservingPTraversal<A, B, C, D>,
  ): IndexedPTraversal<I, S, T, C, D>;
  override compose<S, T, A, B, C, D>(
    this: PTraversal<S, T, A, B>,
    that: PTraversal<A, B, C, D>,
  ): PTraversal<S, T, D, C>;
  override compose<S, T, A, B, C, D>(
    this: IndexedPSetter<I, S, T, A, B>,
    that: IndexPreservingPSetter<A, B, C, D>,
  ): IndexedPSetter<I, S, T, C, D>;
  override compose<S, T, A, B, C, D>(
    this: PSetter<S, T, A, B>,
    that: PSetter<A, B, C, D>,
  ): PSetter<S, T, C, D>;
  override compose<T, B, D>(
    this: Review<T, B>,
    that: Review<B, D>,
  ): Review<T, D>;
  override compose<I, S, A, C>(
    this: IndexedGetter<I, S, A>,
    that: IndexPreservingGetter<A, C>,
  ): IndexedGetter<I, S, C>;
  override compose<S, A, C>(
    this: Getter<S, A>,
    that: Getter<A, C>,
  ): Getter<S, C>;
  override compose<I, S, A, C>(
    this: IndexedFold<I, S, A>,
    that: IndexPreservingFold<A, C>,
  ): IndexedFold<I, S, C>;
  override compose<S, A, C>(this: Fold<S, A>, that: Fold<A, C>): Fold<S, C>;
  override compose<I, S, T, A, B, C, D>(this: any, that: any): any {
    if (that.constructor === IndexPreservingOptic) {
      const self = this as IndexedOptic<I, S, T, A, B>;
      const other = that as IndexPreservingOptic<A, B, C, D>;
      return new IndexedOptic<I, S, T, C, D>(
        <F, P, RepF, CorepF>(
          F: Contravariant<F> & Settable<F>,
          P: Indexable<P, I, RepF, CorepF> & Bifunctor<P>,
        ) => F1.compose(self.runOptic(F, P), other.runOptic(F, P)),
      );
    } else {
      const self = this as Optic<S, T, A, B>;
      const other = that as Optic<A, B, C, D>;
      return new Optic<S, T, C, D>(
        <F>(
          F: Contravariant<F> & Settable<F>,
          P: Function1Indexable & Bifunctor<Function1F>,
        ) => F1.compose(self.runOptic(F, P), other.runOptic(F, P)),
      );
    }
  }

  icomposeL<I, S, T, A, B, C, D>(
    this: IndexedPLens<I, S, T, A, B>,
    that: PLens<A, B, C, D>,
  ): IndexedPLens<I, S, T, A, B>;
  icomposeL<I, S, T, A, B, C, D>(
    this: IndexedPTraversal<I, S, T, A, B>,
    that: PTraversal<A, B, C, D>,
  ): IndexedPTraversal<I, S, T, C, D>;
  icomposeL<I, S, T, A, B, C, D>(
    this: IndexedPSetter<I, S, T, A, B>,
    that: PSetter<A, B, C, D>,
  ): IndexedPSetter<I, S, T, C, D>;
  icomposeL<I, S, A, C>(
    this: IndexedGetter<I, S, A>,
    that: Getter<A, C>,
  ): IndexedGetter<I, S, C>;
  icomposeL<I, S, A, C>(
    this: IndexedFold<I, S, A>,
    that: Fold<A, C>,
  ): IndexedFold<I, S, C>;
  icomposeL<I, S, T, A, B, C, D>(this: any, that: any): any {
    const self = this as IndexedOptic<I, S, T, A, B>;
    const other = that as Optic<A, B, C, D>;
    const Q = Indexable.Indexed<I>() as any as IndexedIndexable<I> &
      Bifunctor<$<IndexedF, [I]>>;
    const R = Indexable.Function1 as any as Function1Indexable &
      Bifunctor<Function1F>;

    return new IndexedOptic<I, S, T, C, D>(
      <F, P>(
        F: Contravariant<F> & Settable<F>,
        P: Indexable<P, I> & Bifunctor<P>,
      ) => {
        const f = self.runOptic(F, Q);
        const g = other.runOptic(F, R);
        return (pcfd: Kind<P, [C, Kind<F, [D]>]>) => {
          const h = P.indexed(pcfd);
          return f((a, i) => g(c => h(c, i))(a));
        };
      },
    );
  }

  icompose<I, J, S, T, A, B, C, D>(
    this: IndexedPLens<I, S, T, A, B>,
    that: IndexedPLens<J, A, B, C, D>,
  ): IndexedPLens<[I, J], S, T, C, D>;
  icompose<I, J, S, T, A, B, C, D>(
    this: IndexedPTraversal<I, S, T, A, B>,
    that: IndexedPTraversal<J, A, B, C, D>,
  ): IndexedPTraversal<[I, J], S, T, C, D>;
  icompose<I, J, S, T, A, B, C, D>(
    this: IndexedPSetter<I, S, T, A, B>,
    that: IndexedPSetter<J, A, B, C, D>,
  ): IndexedPSetter<[I, J], S, T, C, D>;
  icompose<I, J, S, A, C>(
    this: IndexedGetter<I, S, A>,
    that: IndexedGetter<J, A, C>,
  ): IndexedGetter<[I, J], S, C>;
  icompose<I, J, S, A, C>(
    this: IndexedFold<I, S, A>,
    that: IndexedFold<J, A, C>,
  ): IndexedFold<[I, J], S, C>;
  icompose(this: any, that: any): any {
    return this.icomposeWith(that, (i: any, j: any) => [i, j]);
  }

  icomposeWith<I, J, K, S, T, A, B, C, D>(
    this: IndexedPLens<I, S, T, A, B>,
    that: IndexedPLens<J, A, B, C, D>,
    f: (i: I, j: J) => K,
  ): IndexedPLens<K, S, T, C, D>;
  icomposeWith<I, J, K, S, T, A, B, C, D>(
    this: IndexedPTraversal<I, S, T, A, B>,
    that: IndexedPTraversal<J, A, B, C, D>,
    f: (i: I, j: J) => K,
  ): IndexedPTraversal<K, S, T, C, D>;
  icomposeWith<I, J, K, S, T, A, B, C, D>(
    this: IndexedPSetter<I, S, T, A, B>,
    that: IndexedPSetter<J, A, B, C, D>,
    f: (i: I, j: J) => K,
  ): IndexedPSetter<K, S, T, C, D>;
  icomposeWith<I, J, K, S, A, C>(
    this: IndexedGetter<I, S, A>,
    that: IndexedGetter<J, A, C>,
    f: (i: I, j: J) => K,
  ): IndexedGetter<K, S, C>;
  icomposeWith<I, J, K, S, A, C>(
    this: IndexedFold<I, S, A>,
    that: IndexedFold<J, A, C>,
    f: (i: I, j: J) => K,
  ): IndexedFold<K, S, C>;
  icomposeWith<I, J, K, S, T, A, B, C, D>(
    this: any,
    that: any,
    ijk: (i: I, j: J) => K,
  ): any {
    const self = this as IndexedOptic<I, S, T, A, B>;
    const other = that as IndexedOptic<J, A, B, C, D>;
    const Q = Indexable.Indexed<I>() as any as IndexedIndexable<I> &
      Bifunctor<$<IndexedF, [I]>>;
    const R = Indexable.Indexed<J>() as any as IndexedIndexable<J> &
      Bifunctor<$<IndexedF, [J]>>;

    return new IndexedOptic<K, S, T, C, D>(
      <F, P>(
        F: Contravariant<F> & Settable<F>,
        P: Indexable<P, K> & Bifunctor<P>,
      ) => {
        const f = self.runOptic(F, Q);
        const g = other.runOptic(F, R);
        return (pcfd: Kind<P, [C, Kind<F, [D]>]>) => {
          const h = P.indexed(pcfd);
          return f((a, i) => g((c, j) => h(c, ijk(i, j)))(a));
        };
      },
    );
  }

  reindex<I, J, S, T, A, B>(
    this: IndexedPLens<I, S, T, A, B>,
    f: (i: I) => J,
  ): IndexedPLens<J, S, T, A, B>;
  reindex<I, J, S, T, A, B>(
    this: IndexedPTraversal<I, S, T, A, B>,
    f: (i: I) => J,
  ): IndexedPTraversal<J, S, T, A, B>;
  reindex<I, J, S, T, A, B>(
    this: IndexedPSetter<I, S, T, A, B>,
    f: (i: I) => J,
  ): IndexedPSetter<J, S, T, A, B>;
  reindex<I, J, S, A>(
    this: IndexedGetter<I, S, A>,
    f: (i: I) => J,
  ): IndexedGetter<J, S, A>;
  reindex<I, J, S, A>(
    this: IndexedFold<I, S, A>,
    f: (i: I) => J,
  ): IndexedFold<J, S, A>;
  reindex<I, J, S, T, A, B>(this: any, f: (i: I) => J): any {
    const self = this as IndexedOptic<I, S, T, A, B>;
    const Q = Indexable.Indexed<I>() as any as IndexedIndexable<I> &
      Bifunctor<$<IndexedF, [I]>>;

    return new IndexedOptic<J, S, T, A, B>(
      <F, P, RepF, CorepF>(
        F: Settable<F> & Contravariant<F>,
        P: Indexable<P, J, RepF, CorepF>,
      ) => reindex(P, f, self.runOptic(F, Q)),
    );
  }
}
