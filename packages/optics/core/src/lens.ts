// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, Kind } from '@fp4ts/core';
import { Applicative, Either, Functor, Option, Right, Some } from '@fp4ts/cats';

import { PSetter } from './setter';
import { PTraversal } from './traversal';
import { Optional, POptional } from './optional';
import { Getter } from './getter';
import { Fold } from './fold';
import { At } from './function';

export class PLens<S, T, A, B> {
  public static id<A>(): Lens<A, A> {
    return new Lens(
      x => x,
      () => x => x,
    );
  }

  public static fromPath<S>(): LensPath<S> {
    const id = PLens.id<S>();
    const fromProp = PLens.fromProp<any>();
    return (...path: any[]) => {
      return path.reduce((acc, prop) => acc.andThen(fromProp(prop)), id);
    };
  }

  public static fromProp<S>(): <K extends keyof S>(k: K) => Lens<S, S[K]> {
    return k =>
      new Lens(
        s => s[k],
        x => s => ({ ...s, [k]: x }),
      );
  }

  public static fromProps<S>(): <KS extends (keyof S)[]>(
    ...ks: KS
  ) => Lens<S, { [k in KS[number]]: S[k] }> {
    return null as any;
  }

  public constructor(
    public readonly get: (s: S) => A,
    public readonly set: (b: B) => (s: S) => T,
  ) {}

  public modifyF<F>(
    F: Functor<F>,
  ): (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]> {
    return f => s => F.map_(f(this.get(s)), b => this.set(b)(s));
  }
  public modifyA<F>(
    F: Applicative<F>,
  ): (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]> {
    return this.modifyF(F);
  }

  public modify(f: (a: A) => B): (s: S) => T {
    return s => this.set(f(this.get(s)))(s);
  }

  public getOrModify: (s: S) => Either<T, A> = compose(Right, this.get);

  public getOption: (s: S) => Option<A> = compose(Some, this.get);

  // -- Composition

  public andThen<C, D>(that: PLens<A, B, C, D>): PLens<S, T, C, D> {
    return new PLens(compose(that.get, this.get), d =>
      this.modify(that.set(d)),
    );
  }

  // -- Conversions

  public asFold(): Fold<S, A> {
    return this.asGetter().asFold();
  }

  public asGetter(): Getter<S, A> {
    return new Getter(this.get);
  }

  public asSetter(): PSetter<S, T, A, B> {
    return new PSetter(this.modify.bind(this));
  }

  public asTraversal(): PTraversal<S, T, A, B> {
    return new PTraversal(this.modifyA.bind(this));
  }

  public asOptional(): POptional<S, T, A, B> {
    return new POptional(this.getOrModify, this.set);
  }

  // -- Additional Syntax

  public filter<B extends A>(
    this: Lens<S, A>,
    f: (a: A) => a is B,
  ): Optional<S, B>;
  public filter(this: Lens<S, A>, f: (a: A) => boolean): Optional<S, A>;
  public filter(this: Lens<S, A>, f: (a: A) => boolean): Optional<S, A> {
    return this.asOptional().filter(f);
  }

  public at<I, A1>(this: Lens<S, A>, i: I, at: At<A, I, A1>): Lens<S, A1> {
    return this.andThen(at.at(i));
  }
}

export class Lens<S, A> extends PLens<S, S, A, A> {}

export interface LensPath<S> {
  <
    K1 extends keyof S,
    K2 extends keyof S[K1],
    K3 extends keyof S[K1][K2],
    K4 extends keyof S[K1][K2][K3],
    K5 extends keyof S[K1][K2][K3][K4],
    K6 extends keyof S[K1][K2][K3][K4][K5],
    K7 extends keyof S[K1][K2][K3][K4][K5][K6],
    K8 extends keyof S[K1][K2][K3][K4][K5][K6][K7],
    K9 extends keyof S[K1][K2][K3][K4][K5][K6][K7][K8],
    K10 extends keyof S[K1][K2][K3][K4][K5][K6][K7][K8][K9],
    K11 extends keyof S[K1][K2][K3][K4][K5][K6][K7][K8][K9][K10],
    K12 extends keyof S[K1][K2][K3][K4][K5][K6][K7][K8][K9][K10][K11],
  >(
    ...path: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12]
  ): Lens<S, S[K1][K2][K3][K4][K5][K6][K7][K8][K9][K10][K11][K12]>;
  <
    K1 extends keyof S,
    K2 extends keyof S[K1],
    K3 extends keyof S[K1][K2],
    K4 extends keyof S[K1][K2][K3],
    K5 extends keyof S[K1][K2][K3][K4],
    K6 extends keyof S[K1][K2][K3][K4][K5],
    K7 extends keyof S[K1][K2][K3][K4][K5][K6],
    K8 extends keyof S[K1][K2][K3][K4][K5][K6][K7],
    K9 extends keyof S[K1][K2][K3][K4][K5][K6][K7][K8],
    K10 extends keyof S[K1][K2][K3][K4][K5][K6][K7][K8][K9],
    K11 extends keyof S[K1][K2][K3][K4][K5][K6][K7][K8][K9][K10],
  >(
    ...path: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11]
  ): Lens<S, S[K1][K2][K3][K4][K5][K6][K7][K8][K9][K10][K11]>;
  <
    K1 extends keyof S,
    K2 extends keyof S[K1],
    K3 extends keyof S[K1][K2],
    K4 extends keyof S[K1][K2][K3],
    K5 extends keyof S[K1][K2][K3][K4],
    K6 extends keyof S[K1][K2][K3][K4][K5],
    K7 extends keyof S[K1][K2][K3][K4][K5][K6],
    K8 extends keyof S[K1][K2][K3][K4][K5][K6][K7],
    K9 extends keyof S[K1][K2][K3][K4][K5][K6][K7][K8],
    K10 extends keyof S[K1][K2][K3][K4][K5][K6][K7][K8][K9],
  >(
    ...path: [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10]
  ): Lens<S, S[K1][K2][K3][K4][K5][K6][K7][K8][K9][K10]>;
  <
    K1 extends keyof S,
    K2 extends keyof S[K1],
    K3 extends keyof S[K1][K2],
    K4 extends keyof S[K1][K2][K3],
    K5 extends keyof S[K1][K2][K3][K4],
    K6 extends keyof S[K1][K2][K3][K4][K5],
    K7 extends keyof S[K1][K2][K3][K4][K5][K6],
    K8 extends keyof S[K1][K2][K3][K4][K5][K6][K7],
    K9 extends keyof S[K1][K2][K3][K4][K5][K6][K7][K8],
  >(
    ...path: [K1, K2, K3, K4, K5, K6, K7, K8, K9]
  ): Lens<S, S[K1][K2][K3][K4][K5][K6][K7][K8][K9]>;
  <
    K1 extends keyof S,
    K2 extends keyof S[K1],
    K3 extends keyof S[K1][K2],
    K4 extends keyof S[K1][K2][K3],
    K5 extends keyof S[K1][K2][K3][K4],
    K6 extends keyof S[K1][K2][K3][K4][K5],
    K7 extends keyof S[K1][K2][K3][K4][K5][K6],
    K8 extends keyof S[K1][K2][K3][K4][K5][K6][K7],
  >(
    ...path: [K1, K2, K3, K4, K5, K6, K7, K8]
  ): Lens<S, S[K1][K2][K3][K4][K5][K6][K7][K8]>;
  <
    K1 extends keyof S,
    K2 extends keyof S[K1],
    K3 extends keyof S[K1][K2],
    K4 extends keyof S[K1][K2][K3],
    K5 extends keyof S[K1][K2][K3][K4],
    K6 extends keyof S[K1][K2][K3][K4][K5],
    K7 extends keyof S[K1][K2][K3][K4][K5][K6],
  >(
    ...path: [K1, K2, K3, K4, K5, K6, K7]
  ): Lens<S, S[K1][K2][K3][K4][K5][K6][K7]>;
  <
    K1 extends keyof S,
    K2 extends keyof S[K1],
    K3 extends keyof S[K1][K2],
    K4 extends keyof S[K1][K2][K3],
    K5 extends keyof S[K1][K2][K3][K4],
    K6 extends keyof S[K1][K2][K3][K4][K5],
  >(
    ...path: [K1, K2, K3, K4, K5, K6]
  ): Lens<S, S[K1][K2][K3][K4][K5][K6]>;
  <
    K1 extends keyof S,
    K2 extends keyof S[K1],
    K3 extends keyof S[K1][K2],
    K4 extends keyof S[K1][K2][K3],
    K5 extends keyof S[K1][K2][K3][K4],
  >(
    ...path: [K1, K2, K3, K4, K5]
  ): Lens<S, S[K1][K2][K3][K4][K5]>;
  <
    K1 extends keyof S,
    K2 extends keyof S[K1],
    K3 extends keyof S[K1][K2],
    K4 extends keyof S[K1][K2][K3],
  >(
    ...path: [K1, K2, K3, K4]
  ): Lens<S, S[K1][K2][K3][K4]>;
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2]>(
    ...path: [K1, K2, K3]
  ): Lens<S, S[K1][K2][K3]>;
  <K1 extends keyof S, K2 extends keyof S[K1]>(...path: [K1, K2]): Lens<
    S,
    S[K1][K2]
  >;
  <K1 extends keyof S>(...path: [K1]): Lens<S, S[K1]>;
  (...path: []): Lens<S, S>;
}
