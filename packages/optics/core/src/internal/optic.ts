// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Bifunctor, Contravariant, Function1F } from '@fp4ts/cats';
import { $, F1, Kind } from '@fp4ts/core';

import type { Fold, IndexedFold } from '../fold';
import type { Getter, IndexedGetter } from '../getter';
import type { PIso } from '../iso';
import type { IndexedPLens, PLens } from '../lens';
import type { PPrism } from '../prism';
import type { Review } from '../review';
import type { IndexedPSetter, PSetter } from '../setter';
import type { IndexedPTraversal, PTraversal } from '../traversal';

import { Function1Indexable, Indexable } from './indexable';
import { indexing, IndexingF } from './indexing';
import { mkIndexingInstance } from './instances';
import { Settable } from './settable';

export class Optic<in S, out T, out A, in B> {
  readonly S!: (s: S) => void;
  readonly T!: () => T;
  readonly A!: () => A;
  readonly B!: (b: B) => void;

  public constructor(
    readonly runOptic: <F>(
      F: Contravariant<F> & Settable<F>,
      P: Function1Indexable & Bifunctor<Function1F>,
    ) => (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]>,
  ) {}

  apply<R>(f: (t: this) => R): R {
    return f(this);
  }

  compose<S, T, A, B, C, D>(
    this: PIso<S, T, A, B>,
    that: PIso<A, B, C, D>,
  ): PIso<S, T, C, D>;
  compose<S, T, A, B, C, D>(
    this: PLens<S, T, A, B>,
    that: PLens<A, B, C, D>,
  ): PLens<S, T, C, D>;
  compose<S, T, A, B, C, D>(
    this: PPrism<S, T, A, B>,
    that: PPrism<A, B, C, D>,
  ): PPrism<S, T, C, D>;
  compose<S, T, A, B, C, D>(
    this: PTraversal<S, T, A, B>,
    that: PTraversal<A, B, C, D>,
  ): PTraversal<S, T, C, D>;
  compose<S, T, A, B, C, D>(
    this: PSetter<S, T, A, B>,
    that: PSetter<A, B, C, D>,
  ): PSetter<S, T, C, D>;
  compose<T, B, D>(this: Review<T, B>, that: Review<B, D>): Review<T, D>;
  compose<S, A, C>(this: Getter<S, A>, that: Getter<A, C>): Getter<S, C>;
  compose<S, A, C>(this: Fold<S, A>, that: Fold<A, C>): Fold<S, C>;
  compose<S, T, A, B, C, D>(this: any, that: any): any {
    const self = this as Optic<S, T, A, B>;
    const other = that as Optic<A, B, C, D>;
    return new Optic<S, T, C, D>(
      <F>(
        F: Contravariant<F> & Settable<F>,
        P: Function1Indexable & Bifunctor<Function1F>,
      ) => F1.compose(self.runOptic(F, P), other.runOptic(F, P)),
    );
  }

  icomposeR<J, S, T, A, B, C, D>(
    this: PLens<S, T, A, B>,
    that: IndexedPLens<J, A, B, C, D>,
  ): IndexedPLens<J, S, T, C, D>;
  icomposeR<J, S, T, A, B, C, D>(
    this: PTraversal<S, T, A, B>,
    that: IndexedPTraversal<J, A, B, C, D>,
  ): IndexedPTraversal<J, S, T, C, D>;
  icomposeR<J, S, T, A, B, C, D>(
    this: PSetter<S, T, A, B>,
    that: IndexedPSetter<J, A, B, C, D>,
  ): IndexedPSetter<J, S, T, C, D>;
  icomposeR<J, S, A, C>(
    this: Getter<S, A>,
    that: IndexedGetter<J, A, C>,
  ): IndexedGetter<J, S, C>;
  icomposeR<J, S, A, C>(
    this: Fold<S, A>,
    that: IndexedFold<J, A, C>,
  ): IndexedFold<J, S, C>;
  icomposeR<J, S, T, A, B, C, D>(this: any, that: any): any {
    const self = this as Optic<S, T, A, B>;
    const other = that as IndexedOptic<J, A, B, C, D>;
    const Q = Indexable.Function1 as any as Function1Indexable &
      Bifunctor<Function1F>;

    return new IndexedOptic<J, S, T, C, D>(
      <F, P, RepF, CorepF>(
        F: Contravariant<F> & Settable<F>,
        P: Indexable<P, J, RepF, CorepF> & Bifunctor<P>,
      ) => F1.compose(self.runOptic(F, Q), other.runOptic(F, P)),
    );
  }

  indexing<S, T, A, B>(
    this: PLens<S, T, A, B>,
  ): IndexedPLens<number, S, T, A, B>;
  indexing<S, T, A, B>(
    this: PTraversal<S, T, A, B>,
  ): IndexedPTraversal<number, S, T, A, B>;
  indexing<S, A>(this: Getter<S, A>): IndexedGetter<number, S, A>;
  indexing<S, A>(this: Fold<S, A>): IndexedFold<number, S, A>;
  indexing<S, T, A, B>(this: any): any {
    const self = this as Optic<S, T, A, B>;
    const Q = Indexable.Function1 as any as Function1Indexable &
      Bifunctor<Function1F>;

    return new IndexedOptic<number, S, T, A, B>(
      <F, P, RepF, CorepF>(
        F: Contravariant<F> & Settable<F>,
        P: Indexable<P, number, RepF, CorepF> & Bifunctor<P>,
      ) =>
        indexing(
          P,
          self.runOptic(
            mkIndexingInstance(F) as any as Contravariant<$<IndexingF, [F]>> &
              Settable<$<IndexingF, [F]>>,
            Q,
          ),
        ),
    );
  }
}

import { IndexedOptic } from './indexed-optic';
