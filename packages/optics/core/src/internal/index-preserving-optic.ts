// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Bifunctor, Contravariant, Function1F } from '@fp4ts/cats';
import { F1, Kind } from '@fp4ts/core';

import type { Fold, IndexPreservingFold } from '../fold';
import type { Getter, IndexPreservingGetter } from '../getter';
import type { IndexPreservingPLens, PLens } from '../lens';
import type { PIso } from '../iso';
import type { PPrism } from '../prism';
import type { Review } from '../review';
import type { IndexPreservingPSetter, PSetter } from '../setter';
import type { IndexPreservingPTraversal, PTraversal } from '../traversal';

import { Conjoined } from './conjoined';
import { Function1Indexable } from './indexable';
import { Optic } from './optic';
import { Settable } from './settable';

export class IndexPreservingOptic<in S, out T, out A, in B> extends Optic<
  S,
  T,
  A,
  B
> {
  public constructor(
    runOptic: <F, P, RepF, CorepF>(
      F: Contravariant<F> & Settable<F>,
      P: Conjoined<P, RepF, CorepF> & Bifunctor<P>,
    ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => Kind<P, [S, Kind<F, [T]>]>,
  ) {
    super(runOptic as any);
  }

  override readonly runOptic!: <F, P>(
    F: Contravariant<F> & Settable<F>,
    P: Conjoined<P, any, any> & Bifunctor<P>,
  ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => Kind<P, [S, Kind<F, [T]>]>;

  override compose<S, T, A, B, C, D>(
    this: PIso<S, T, A, B>,
    that: PIso<A, B, C, D>,
  ): PIso<S, T, C, D>;
  override compose<S, T, A, B, C, D>(
    this: IndexPreservingPLens<S, T, A, B>,
    that: IndexPreservingPLens<A, B, C, D>,
  ): IndexPreservingPLens<S, T, C, D>;
  override compose<S, T, A, B, C, D>(
    this: PLens<S, T, A, B>,
    that: PLens<A, B, C, D>,
  ): PLens<S, T, C, D>;
  override compose<S, T, A, B, C, D>(
    this: PPrism<S, T, A, B>,
    that: PPrism<A, B, C, D>,
  ): PPrism<S, T, C, D>;
  override compose<S, T, A, B, C, D>(
    this: IndexPreservingPTraversal<S, T, A, B>,
    that: IndexPreservingPTraversal<A, B, C, D>,
  ): IndexPreservingPTraversal<S, T, C, D>;
  override compose<S, T, A, B, C, D>(
    this: PTraversal<S, T, A, B>,
    that: PTraversal<A, B, C, D>,
  ): PTraversal<S, T, C, D>;
  override compose<S, T, A, B, C, D>(
    this: IndexPreservingPSetter<S, T, A, B>,
    that: IndexPreservingPSetter<A, B, C, D>,
  ): IndexPreservingPSetter<S, T, C, D>;
  override compose<S, T, A, B, C, D>(
    this: PSetter<S, T, A, B>,
    that: PSetter<A, B, C, D>,
  ): PSetter<S, T, C, D>;
  override compose<T, B, D>(
    this: Review<T, B>,
    that: Review<B, D>,
  ): Review<T, D>;
  override compose<S, A, C>(
    this: IndexPreservingGetter<S, A>,
    that: IndexPreservingGetter<A, C>,
  ): IndexPreservingGetter<S, C>;
  override compose<S, A, C>(
    this: Getter<S, A>,
    that: Getter<A, C>,
  ): Getter<S, C>;
  override compose<S, A, C>(
    this: IndexPreservingFold<S, A>,
    that: IndexPreservingFold<A, C>,
  ): IndexPreservingFold<S, C>;
  override compose<S, A, C>(this: Fold<S, A>, that: Fold<A, C>): Fold<S, C>;
  override compose<S, T, A, B, C, D>(this: any, that: any): any {
    if (that.constructor === IndexPreservingOptic) {
      const self = this as IndexPreservingOptic<S, T, A, B>;
      const other = that as IndexPreservingOptic<A, B, C, D>;
      return new IndexPreservingOptic<S, T, C, D>(
        <F, P, RepF, CorepF>(
          F: Contravariant<F> & Settable<F>,
          P: Conjoined<P, RepF, CorepF> & Bifunctor<P>,
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
}
