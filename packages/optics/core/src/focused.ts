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

  isEmpty<S, A>(this: Focused<F.Fold<S, A>>, s: S): boolean {
    return F.isEmpty(this.toOptic)(s);
  }
  nonEmpty<S, A>(this: Focused<F.Fold<S, A>>, s: S): boolean {
    return F.nonEmpty(this.toOptic)(s);
  }

  headOption<S, A>(this: Focused<F.Fold<S, A>>, s: S): Option<A> {
    return F.headOption(this.toOptic)(s);
  }
  preview<S, A>(this: Focused<F.Fold<S, A>>, s: S): Option<A> {
    return this.headOption(s);
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

  // -- Setter

  modify<S, T, A, B>(this: Focused<ST.PSetter<S, T, A, B>>, f: (a: A) => B): (s: S) => T {
    return ST.modify(this.toOptic)(f);
  }

  replace<S, T, A, B>(this: Focused<ST.PSetter<S, T, A, B>>, b: B): (s: S) => T {
    return ST.replace(this.toOptic)(b);
  }

  plus<S, T>(this: Focused<ST.PSetter<S, T, number, number>>, n: number): (s: S) => T {
    return ST.plus(this.toOptic)(n);
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

  // -- Getter

  view<S, A>(this: Focused<G.Getting<A, S, A>>, s: S): A {
    return G.view(this.toOptic)(s);
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

  // -- Prism

  matching<S, T, A, B>(this: Focused<P.PPrism<S, T, A, B>>, s: S): Either<T, A> {
    return this.getOrModify(s);
  }

  reverseGet<S, T, A, B>(this: Focused<P.PPrism<S, T, A, B>>, b: B): T {
    return P.reverseGet(this.toOptic)(b);
  }
  review<S, T, A, B>(this: Focused<P.PPrism<S, T, A, B>>, b: B): T {
    return this.reverseGet(b);
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
