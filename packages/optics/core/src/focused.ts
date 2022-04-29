// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import {
  Applicative,
  Array,
  Either,
  List,
  Monoid,
  Option,
  Semigroup,
  Traversable,
} from '@fp4ts/cats';
import { MonadReader, MonadState } from '@fp4ts/cats-mtl';
import * as I from './iso';
import * as F from './fold';
import * as ST from './setter';
import * as G from './getter';
import * as L from './lens';
import * as OP from './optional';
import * as P from './prism';
import * as T from './traversal';
import { compose_ } from './compose';
import { AnyOptical } from './optics';

/* eslint-disable prettier/prettier */
export function focus<A>(): Focused<I.Iso<A, A>>;
export function focus<O extends AnyOptical<any, any, any, any>>(o: O): Focused<O>;
export function focus(o: any = I.iso()): Focused<any> {
  return new Focused(o);
}
/* eslint-enabled prettier/prettier */

export class Focused<O> {
  constructor(readonly toOptic: O) {}

  /* eslint-disable prettier/prettier */

  // -- Fold

  words<S>(this: Focused<T.Traversal<S, string>>): Focused<T.Traversal<S, string>>;
  words<S>(this: Focused<F.Fold<S, string>>): Focused<F.Fold<S, string>>;
  words<S>(this: Focused<F.Fold<S, string>>): Focused<F.Fold<S, string>> {
    return this.andThen(F.words);
  }

  lines<S>(this: Focused<T.Traversal<S, string>>): Focused<T.Traversal<S, string>>;
  lines<S>(this: Focused<F.Fold<S, string>>): Focused<F.Fold<S, string>>;
  lines<S>(this: Focused<F.Fold<S, string>>): Focused<F.Fold<S, string>> {
    return this.andThen(F.lines);
  }

  foldMap<R, S, A>(this: Focused<G.Getting<R, S, A>>, f: (a: A) => R): (s: S) => R {
    return F.foldMap(this.toOptic)(f);
  }

  fold<S, A>(this: Focused<G.Getting<A, S, A>>, s: S): A {
    return F.fold(this.toOptic)(s);
  }

  foldRight<R, S, A>(this: Focused<F.Fold<S, A>>, z: R, f: (a: A, r: R) => R):  (s: S) => R {
    return F.foldRight(this.toOptic)(z, f);
  }
  foldLeft<R, S, A>(this: Focused<F.Fold<S, A>>, z: R, f: (r: R, a: A) => R):  (s: S) => R {
    return F.foldLeft(this.toOptic)(z, f);
  }

  toList<S, A>(this: Focused<F.Fold<S, A>>, s: S): List<A> {
    return F.toList(this.toOptic)(s);
  }

  preview<R, S, A>(this: Focused<F.Fold<S, A>>, R: MonadReader<R, S>): Kind<R, [Option<A>]> {
    return F.preview(R)(this.toOptic);
  }
  preuse<R, S, A>(this: Focused<F.Fold<S, A>>, R: MonadState<R, S>): Kind<R, [Option<A>]> {
    return F.preuse(R)(this.toOptic);
  }

  isEmpty<S, A>(this: Focused<F.Fold<S, A>>, s: S): boolean {
    return F.isEmpty(this.toOptic)(s);
  }
  nonEmpty<S, A>(this: Focused<F.Fold<S, A>>, s: S): boolean {
    return F.nonEmpty(this.toOptic)(s);
  }

  headOption<S, A>(this: Focused<F.Fold<S, A>>, s: S): Option<A> {
    return F.headOption(this.toOptic)(s);
  }

  lastOption<S, A>(this: Focused<F.Fold<S, A>>, s: S): Option<A> {
    return F.lastOption(this.toOptic)(s);
  }
  
  find<S, A, B extends A>(this: Focused<F.Fold<S, A>>, p: (a: A) => a is B): (s: S) => Option<B>;
  find<S, A>(this: Focused<F.Fold<S, A>>, p: (a: A) => boolean): (s: S) => Option<A>;
  find<S, A>(this: Focused<F.Fold<S, A>>, p: (a: A) => boolean): (s: S) => Option<A> {
    return F.find(this.toOptic)(p);
  }

  any<S, A>(this: Focused<F.Fold<S, A>>, p: (a: A) => boolean): (s: S) => boolean {
    return F.any(this.toOptic)(p);
  }
  all<S, A>(this: Focused<F.Fold<S, A>>, p: (a: A) => boolean): (s: S) => boolean {
    return F.all(this.toOptic)(p);
  }
  count<S, A>(this: Focused<F.Fold<S, A>>, p: (a: A) => boolean): (s: S) => number {
    return F.count(this.toOptic)(p);
  }

  size<S, A>(this: Focused<F.Fold<S, A>>, s: S): number {
    return F.size(this.toOptic)(s);
  }

  filter<S, A, B extends A>(this: Focused<P.Prism<S, A>>, p: (a: A) => a is B): Focused<P.Prism<S, B>>;
  filter<S, A>(this: Focused<P.Prism<S, A>>, p: (a: A) => boolean): Focused<P.Prism<S, A>>;
  filter<S, A, B extends A>(this: Focused<OP.Optional<S, A>>, p: (a: A) => a is B): Focused<OP.Optional<S, B>>;
  filter<S, A>(this: Focused<OP.Optional<S, A>>, p: (a: A) => boolean): Focused<OP.Optional<S, A>>;
  filter<S, A, B extends A>(this: Focused<T.Traversal<S, A>>, p: (a: A) => a is B): Focused<T.Traversal<S, B>>;
  filter<S, A>(this: Focused<T.Traversal<S, A>>, p: (a: A) => boolean): Focused<T.Traversal<S, A>>;
  filter<S, A, B extends A>(this: Focused<ST.Setter<S, A>>, p: (a: A) => a is B): Focused<ST.Setter<S, B>>;
  filter<S, A>(this: Focused<ST.Setter<S, A>>, p: (a: A) => boolean): Focused<ST.Setter<S, A>>;
  filter<S, A, B extends A>(this: Focused<F.Fold<S, A>>, p: (a: A) => a is B): Focused<F.Fold<S, B>>;
  filter<S, A>(this: Focused<F.Fold<S, A>>, p: (a: A) => boolean): Focused<F.Fold<S, A>>;
  filter<S, A>(this: Focused<AnyOptical<S, S, A, A>>, p: (a: A) => boolean): Focused<AnyOptical<S, S, A, A>> {
    return this.andThen(F.filtered(p));
  }

  backwards<S, T, A, B>(this: Focused<T.PTraversal<S, T, A, B>>): Focused<T.PTraversal<S, T, A, B>>;
  backwards<S, A>(this: Focused<F.Fold<S, A>>): Focused<F.Fold<S, A>>;
  backwards<S, A>(this: Focused<F.Fold<S, A>>): Focused<F.Fold<S, A>> {
    return new Focused(F.backwards(this.toOptic));
  }

  // -- Setter

  modify<S, T, A, B>(this: Focused<ST.PSetter<S, T, A, B>>, f: (a: A) => B): (s: S) => T {
    return ST.modify(this.toOptic)(f);
  }

  replace<S, T, A, B>(this: Focused<ST.PSetter<S, T, A, B>>, b: B): (s: S) => T {
    return ST.replace(this.toOptic)(b);
  }

  add<S, T>(this: Focused<ST.PSetter<S, T, number, number>>, n: number): (s: S) => T {
    return ST.add(this.toOptic)(n);
  }
  sub<S, T>(this: Focused<ST.PSetter<S, T, number, number>>, n: number): (s: S) => T {
    return ST.sub(this.toOptic)(n);
  }
  mul<S, T>(this: Focused<ST.PSetter<S, T, number, number>>, n: number): (s: S) => T {
    return ST.mul(this.toOptic)(n);
  }
  div<S, T>(this: Focused<ST.PSetter<S, T, number, number>>, n: number): (s: S) => T {
    return ST.div(this.toOptic)(n);
  }
  and<S, T>(this: Focused<ST.PSetter<S, T, boolean, boolean>>, n: boolean): (s: S) => T {
    return ST.and(this.toOptic)(n);
  }
  or<S, T>(this: Focused<ST.PSetter<S, T, boolean, boolean>>, n: boolean): (s: S) => T {
    return ST.or(this.toOptic)(n);
  }
  concat<S, T, A>(this: Focused<ST.PSetter<S, T, A, A>>, S: Semigroup<A>): (a: A) => (s: S) => T {
    return ST.concat(S)(this.toOptic);
  }

  assign<R, S, A, B>(this: Focused<ST.PSetter<S, S, A, B>>, R: MonadState<R, S>): (b: B) => Kind<R, [void]> {
    return ST.assign(R)(this.toOptic);
  }
  assignF<R, S, A, B>(this: Focused<ST.PSetter<S, S, A, B>>, R: MonadState<R, S>): (rb: Kind<R, [B]>) => Kind<R, [void]> {
    return ST.assignF(R)(this.toOptic);
  }
  modifying<R, S, A, B>(this: Focused<ST.PSetter<S, S, A, B>>, R: MonadState<R, S>): (f: (a: A) => B) => Kind<R, [void]> {
    return ST.modifying(R)(this.toOptic);
  }

  adding<R, S>(this: Focused<ST.Setter<S, number>>, R: MonadState<R, S>): (n: number) => Kind<R, [void]> {
    return ST.adding(R)(this.toOptic);
  }
  subtracting<R, S>(this: Focused<ST.Setter<S, number>>, R: MonadState<R, S>): (n: number) => Kind<R, [void]> {
    return ST.subtracting(R)(this.toOptic);
  }
  multiplying<R, S>(this: Focused<ST.Setter<S, number>>, R: MonadState<R, S>): (n: number) => Kind<R, [void]> {
    return ST.multiplying(R)(this.toOptic);
  }
  dividing<R, S>(this: Focused<ST.Setter<S, number>>, R: MonadState<R, S>): (n: number) => Kind<R, [void]> {
    return ST.dividing(R)(this.toOptic);
  }
  anding<R, S>(this: Focused<ST.Setter<S, boolean>>, R: MonadState<R, S>): (b: boolean) => Kind<R, [void]> {
    return ST.anding(R)(this.toOptic);
  }
  oring<R, S>(this: Focused<ST.Setter<S, boolean>>, R: MonadState<R, S>): (b: boolean) => Kind<R, [void]> {
    return ST.oring(R)(this.toOptic);
  }
  concatenating<R, S, A>(this: Focused<ST.Setter<S, A>>, R: MonadState<R, S>, S: Semigroup<A>): (a: A) => Kind<R, [void]> {
    return ST.concatenating(R, S)(this.toOptic);
  }

  locally<R, S, A, B>(this: Focused<ST.PSetter<S, S, A, B>>, R: MonadReader<R, S>): (f: (a: A) => B) => <X>(rx: Kind<R, [X]>) => Kind<R, [X]> {
    return ST.locally(R)(this.toOptic);
  }

  // -- Getter

  view<R, S, A>(this: Focused<G.Getting<A, S, A>>, R: MonadReader<R, S>): Kind<R, [A]> {
    return G.view(R)(this.toOptic);
  }
  use<R, S, A>(this: Focused<G.Getting<A, S, A>>, R: MonadState<R, S>): Kind<R, [A]> {
    return G.use(R)(this.toOptic);
  }

  get<S, A>(this: Focused<G.Getter<S, A>>, s: S): A {
    return G.get(this.toOptic)(s);
  }

  to<S, A, C>(this: Focused<G.Getter<S, A>>, f: (a: A) => C): Focused<G.Getter<S, C>>;
  to<S, A, C>(this: Focused<F.Fold<S, A>>, f: (a: A) => C): Focused<F.Fold<S, C>>;
  to<S, A, C>(this: Focused<F.Fold<S, A>>, f: (a: A) => C): Focused<F.Fold<S, C>> {
    return this.andThen(G.to(f));
  }

  asGetting<S, A>(this: Focused<G.Getter<S, A>>): Focused<G.Getting<A, S, A>>;
  asGetting<R, S, A>(this: Focused<F.Fold<S, A>>, R: Monoid<R>): Focused<G.Getting<R, S, A>>;
  asGetting(this: Focused<any>, R?: Monoid<any>): Focused<G.Getting<any, any, any>> {
    return new Focused(G.asGetting(R!)(this.toOptic));
  }

  // -- Traversal

  traverse<F, S, T, A, B>(this: Focused<T.PTraversal<S, T, A, B>>, F: Applicative<F>): (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]> {
    return T.traverse(F)(this.toOptic);
  }

  sequence<F, S, T, B>(this: Focused<T.PTraversal<S, T, Kind<F, [B]>, B>>, F: Applicative<F>): (s: S) => Kind<F, [T]> {
    return T.sequence(F)(this.toOptic);
  }

  mapAccumL<S, T, A, B, Acc>(this: Focused<T.PTraversal<S, T, A, B>>, z: Acc, f: (acc: Acc, a: A) => [Acc, B]): (s: S) => [Acc, T] {
    return T.mapAccumL(this.toOptic)(z, f);
  }
  mapAccumR<S, T, A, B, Acc>(this: Focused<T.PTraversal<S, T, A, B>>, z: Acc, f: (acc: Acc, a: A) => [Acc, B]): (s: S) => [Acc, T] {
    return T.mapAccumR(this.toOptic)(z, f);
  }

  each<S, T, A, B>(this: Focused<T.PTraversal<S, T, A[], B[]>>): Focused<T.PTraversal<S, T, A, B>>;
  each<G, S, T, A, B>(this: Focused<T.PTraversal<S, T, Kind<G, [A]>, Kind<G, [B]>>>, G: Traversable<G>): Focused<T.PTraversal<S, T, A, B>>;
  each<S, A>(this: Focused<F.Fold<S, A[]>>): Focused<F.Fold<S, A>>;
  each<G, S, A>(this: Focused<F.Fold<S, Kind<G, [A]>>>, G: Traversable<G>): Focused<F.Fold<S, A>>;
  each<G, S, A>(this: Focused<F.Fold<S, Kind<G, [A]>>>, G: Traversable<G> = Array.Traversable() as any as Traversable<G>): Focused<F.Fold<S, A>> {
    return this.andThen(T.fromTraversable(G)<A>());
  }

  // -- Optional

  getOptional<S, T, A, B>(this: Focused<OP.POptional<S, T, A, B>>, s: S): Option<A> {
    return OP.getOption(this.toOptic)(s);
  }

  getOrModify<S, T, A, B>(this: Focused<OP.POptional<S, T, A, B>>, s: S): Either<T, A> {
    return OP.getOrModify(this.toOptic)(s);
  }

  re<T, B>(this: Focused<P.Prism<T, B>>): Focused<G.Getter<B, T>> {
    return new Focused(OP.re(this.toOptic));
  }

  review<R, B, T>(this: Focused<OP.AReview<T, B>>, R: MonadReader<R, B>): Kind<R, [T]> {
    return OP.review(R)(this.toOptic);
  }

  reuse<R, B, T>(this: Focused<OP.AReview<T, B>>, R: MonadState<R, B>): Kind<R, [T]> {
    return OP.reuse(R)(this.toOptic);
  }

  // -- Prism

  matching<S, T, A, B>(this: Focused<P.PPrism<S, T, A, B>>, s: S): Either<T, A> {
    return this.getOrModify(s);
  }

  reverseGet<S, T, A, B>(this: Focused<P.PPrism<S, T, A, B>>, b: B): T {
    return P.reverseGet(this.toOptic)(b);
  }

  // -- Lens

  prop<A, K extends keyof A, S, T>(this: Focused<L.PLens<S, T, A, A>>, k: K): Focused<L.PLens<S, T, A[K], A[K]>>;
  prop<A, K extends keyof A, S, T>(this: Focused<P.PPrism<S, T, A, A>>, k: K): Focused<T.PTraversal<S, T, A[K], A[K]>>;
  prop<A, K extends keyof A, S, T>(this: Focused<OP.POptional<S, T, A, A>>, k: K): Focused<OP.POptional<S, T, A[K], A[K]>>;
  prop<A, K extends keyof A, S, T>(this: Focused<T.PTraversal<S, T, A, A>>, k: K): Focused<T.PTraversal<S, T, A[K], A[K]>>;
  prop<A, K extends keyof A, S, T>(this: Focused<ST.PSetter<S, T, A, A>>, k: K): Focused<ST.PSetter<S, T, A[K], A[K]>>;
  prop<A, K extends keyof A, S, T>(this: Focused<ST.PSetter<S, T, A, A>>, k: K): Focused<ST.PSetter<S, T, A[K], A[K]>>;
  prop<A, K extends keyof A, S>(this: Focused<G.Getter<S, A>>, k: K): Focused<G.Getter<S, A[K]>>;
  prop<A, K extends keyof A, S>(this: Focused<F.Fold<S, A>>, k: K): Focused<F.Fold<S, A[K]>>;
  prop<A, K extends keyof A, S, T>(this: Focused<AnyOptical<S, T, A, A>>, k: K): Focused<AnyOptical<S, T, A[K], A[K]>> {
    return this.andThen(L.fromProp<A>()(k));
  }

  // -- Composition

  andThen<S, T, A, B, C, D>(this: Focused<I.PIso<S, T, A, B>>, that: Focused<I.PIso<A, B, C, D>>): Focused<I.PIso<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<I.PIso<S, T, A, B>>, that: I.PIso<A, B, C, D>): Focused<I.PIso<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<I.PIso<S, T, A, B>>, that: Focused<L.PLens<A, B, C, D>>): Focused<L.PLens<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<I.PIso<S, T, A, B>>, that: L.PLens<A, B, C, D>): Focused<L.PLens<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<I.PIso<S, T, A, B>>, that: Focused<P.PPrism<A, B, C, D>>): Focused<P.PPrism<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<I.PIso<S, T, A, B>>, that: P.PPrism<A, B, C, D>): Focused<P.PPrism<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<I.PIso<S, T, A, B>>, that: Focused<OP.POptional<A, B, C, D>>): Focused<OP.POptional<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<I.PIso<S, T, A, B>>, that: OP.POptional<A, B, C, D>): Focused<OP.POptional<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<I.PIso<S, T, A, B>>, that: Focused<T.PTraversal<A, B, C, D>>): Focused<T.PTraversal<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<I.PIso<S, T, A, B>>, that: T.PTraversal<A, B, C, D>): Focused<T.PTraversal<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<I.PIso<S, T, A, B>>, that: Focused<ST.PSetter<A, B, C, D>>): Focused<ST.PSetter<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<I.PIso<S, T, A, B>>, that: ST.PSetter<A, B, C, D>): Focused<ST.PSetter<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<I.PIso<S, T, A, B>>, that: Focused<G.Getter<A, C>>): Focused<G.Getter<S, C>>;
  andThen<S, T, A, B, C, D>(this: Focused<I.PIso<S, T, A, B>>, that: G.Getter<A, C>): Focused<G.Getter<S, C>>;
  andThen<S, T, A, B, C, D>(this: Focused<I.PIso<S, T, A, B>>, that: Focused<F.Fold<A, C>>): Focused<F.Fold<S, C>>;
  andThen<S, T, A, B, C, D>(this: Focused<I.PIso<S, T, A, B>>, that: F.Fold<A, C>): Focused<F.Fold<S, C>>;

  andThen<S, T, A, B, C, D>(this: Focused<L.PLens<S, T, A, B>>, that: Focused<L.PLens<A, B, C, D>>): Focused<L.PLens<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<L.PLens<S, T, A, B>>, that: L.PLens<A, B, C, D>): Focused<L.PLens<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<L.PLens<S, T, A, B>>, that: Focused<OP.POptional<A, B, C, D>>): Focused<OP.POptional<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<L.PLens<S, T, A, B>>, that: OP.POptional<A, B, C, D>): Focused<OP.POptional<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<L.PLens<S, T, A, B>>, that: Focused<T.PTraversal<A, B, C, D>>): Focused<T.PTraversal<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<L.PLens<S, T, A, B>>, that: T.PTraversal<A, B, C, D>): Focused<T.PTraversal<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<L.PLens<S, T, A, B>>, that: Focused<ST.PSetter<A, B, C, D>>): Focused<ST.PSetter<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<L.PLens<S, T, A, B>>, that: ST.PSetter<A, B, C, D>): Focused<ST.PSetter<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<L.PLens<S, T, A, B>>, that: Focused<G.Getter<A, C>>): Focused<G.Getter<S, C>>;
  andThen<S, T, A, B, C, D>(this: Focused<L.PLens<S, T, A, B>>, that: G.Getter<A, C>): Focused<G.Getter<S, C>>;
  andThen<S, T, A, B, C, D>(this: Focused<L.PLens<S, T, A, B>>, that: Focused<F.Fold<A, C>>): Focused<F.Fold<S, C>>;
  andThen<S, T, A, B, C, D>(this: Focused<L.PLens<S, T, A, B>>, that: F.Fold<A, C>): Focused<F.Fold<S, C>>;

  andThen<S, T, A, B, C, D>(this: Focused<P.PPrism<S, T, A, B>>, that: Focused<P.PPrism<A, B, C, D>>): Focused<P.PPrism<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<P.PPrism<S, T, A, B>>, that: P.PPrism<A, B, C, D>): Focused<P.PPrism<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<P.PPrism<S, T, A, B>>, that: Focused<OP.POptional<A, B, C, D>>): Focused<OP.POptional<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<P.PPrism<S, T, A, B>>, that: OP.POptional<A, B, C, D>): Focused<OP.POptional<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<P.PPrism<S, T, A, B>>, that: Focused<T.PTraversal<A, B, C, D>>): Focused<T.PTraversal<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<P.PPrism<S, T, A, B>>, that: T.PTraversal<A, B, C, D>): Focused<T.PTraversal<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<P.PPrism<S, T, A, B>>, that: Focused<ST.PSetter<A, B, C, D>>): Focused<ST.PSetter<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<P.PPrism<S, T, A, B>>, that: ST.PSetter<A, B, C, D>): Focused<ST.PSetter<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<P.PPrism<S, T, A, B>>, that: Focused<G.Getter<A, C>>): Focused<F.Fold<S, C>>;
  andThen<S, T, A, B, C, D>(this: Focused<P.PPrism<S, T, A, B>>, that: G.Getter<A, C>): Focused<F.Fold<S, C>>;
  andThen<S, T, A, B, C, D>(this: Focused<P.PPrism<S, T, A, B>>, that: Focused<F.Fold<A, C>>): Focused<F.Fold<S, C>>;
  andThen<S, T, A, B, C, D>(this: Focused<P.PPrism<S, T, A, B>>, that: F.Fold<A, C>): Focused<F.Fold<S, C>>;

  andThen<S, T, A, B, C, D>(this: Focused<OP.POptional<S, T, A, B>>, that: Focused<OP.POptional<A, B, C, D>>): Focused<OP.POptional<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<OP.POptional<S, T, A, B>>, that: OP.POptional<A, B, C, D>): Focused<OP.POptional<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<OP.POptional<S, T, A, B>>, that: Focused<T.PTraversal<A, B, C, D>>): Focused<T.PTraversal<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<OP.POptional<S, T, A, B>>, that: T.PTraversal<A, B, C, D>): Focused<T.PTraversal<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<OP.POptional<S, T, A, B>>, that: Focused<ST.PSetter<A, B, C, D>>): Focused<ST.PSetter<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<OP.POptional<S, T, A, B>>, that: ST.PSetter<A, B, C, D>): Focused<ST.PSetter<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<OP.POptional<S, T, A, B>>, that: Focused<G.Getter<A, C>>): Focused<F.Fold<S, C>>;
  andThen<S, T, A, B, C, D>(this: Focused<OP.POptional<S, T, A, B>>, that: G.Getter<A, C>): Focused<F.Fold<S, C>>;
  andThen<S, T, A, B, C, D>(this: Focused<OP.POptional<S, T, A, B>>, that: Focused<F.Fold<A, C>>): Focused<F.Fold<S, C>>;
  andThen<S, T, A, B, C, D>(this: Focused<OP.POptional<S, T, A, B>>, that: F.Fold<A, C>): Focused<F.Fold<S, C>>;

  andThen<S, T, A, B, C, D>(this: Focused<T.PTraversal<S, T, A, B>>, that: Focused<T.PTraversal<A, B, C, D>>): Focused<T.PTraversal<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<T.PTraversal<S, T, A, B>>, that: T.PTraversal<A, B, C, D>): Focused<T.PTraversal<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<T.PTraversal<S, T, A, B>>, that: Focused<ST.PSetter<A, B, C, D>>): Focused<ST.PSetter<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<T.PTraversal<S, T, A, B>>, that: ST.PSetter<A, B, C, D>): Focused<ST.PSetter<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<T.PTraversal<S, T, A, B>>, that: Focused<G.Getter<A, C>>): Focused<F.Fold<S, C>>;
  andThen<S, T, A, B, C, D>(this: Focused<T.PTraversal<S, T, A, B>>, that: G.Getter<A, C>): Focused<F.Fold<S, C>>;
  andThen<S, T, A, B, C, D>(this: Focused<T.PTraversal<S, T, A, B>>, that: Focused<F.Fold<A, C>>): Focused<F.Fold<S, C>>;
  andThen<S, T, A, B, C, D>(this: Focused<T.PTraversal<S, T, A, B>>, that: F.Fold<A, C>): Focused<F.Fold<S, C>>;

  andThen<S, T, A, B, C, D>(this: Focused<ST.PSetter<S, T, A, B>>, that: Focused<ST.PSetter<A, B, C, D>>): Focused<ST.PSetter<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<ST.PSetter<S, T, A, B>>, that: ST.PSetter<A, B, C, D>): Focused<ST.PSetter<S, T, C, D>>;

  andThen<S, A, C>(this: Focused<G.Getter<S, A>>, that: Focused<G.Getter<A, C>>): Focused<G.Getter<S, C>>;
  andThen<S, A, C>(this: Focused<G.Getter<S, A>>, that: G.Getter<A, C>): Focused<G.Getter<S, C>>;
  andThen<S, A, C>(this: Focused<G.Getter<S, A>>, that: Focused<F.Fold<A, C>>): Focused<F.Fold<S, C>>;
  andThen<S, A, C>(this: Focused<G.Getter<S, A>>, that: F.Fold<A, C>): Focused<F.Fold<S, C>>;

  andThen<S, A, C>(this: Focused<F.Fold<S, A>>, that: Focused<F.Fold<A, C>>): Focused<F.Fold<S, C>>;
  andThen<S, A, C>(this: Focused<F.Fold<S, A>>, that: F.Fold<A, C>): Focused<F.Fold<S, C>>;

  andThen<S, T, A, B, C, D>(this: Focused<AnyOptical<S, T, A, B>>, that: Focused<AnyOptical<A, B, C, D>>): Focused<AnyOptical<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<AnyOptical<S, T, A, B>>, that: AnyOptical<A, B, C, D>): Focused<AnyOptical<S, T, C, D>>;
  andThen<S, T, A, B, C, D>(this: Focused<AnyOptical<S, T, A, B>>, that: Focused<AnyOptical<A, B, C, D>> | AnyOptical<A, B, C, D>): Focused<AnyOptical<S, T, C, D>> {
    return that instanceof Focused
      ? new Focused(compose_(this.toOptic, that.toOptic))
      : new Focused(compose_(this.toOptic, that));
  }
}
