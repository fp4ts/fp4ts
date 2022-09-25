// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, id } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Applicative } from '../../../applicative';
import { Eval } from '../../../eval';

import { Ior } from '../../ior';
import { Option, Some, None } from '../../option';
import { Either } from '../../either';
import { List } from '../list';
import { Chain } from '../chain';
import { arrayFoldableWithIndex } from './instances';

export const head: <A>(xs: A[]) => A = xs => {
  const h = xs[0];
  if (!h) throw new Error('[].head');
  return h;
};

export const tail: <A>(xs: A[]) => A[] = xs => xs.slice(1);

export const isEmpty: <A>(xs: A[]) => boolean = xs => xs.length === 0;
export const nonEmpty: <A>(xs: A[]) => boolean = xs => xs.length !== 0;

export const size: <A>(xs: A[]) => number = xs => xs.length;

export const take =
  (n: number) =>
  <A>(xs: A[]): A[] =>
    take_(xs, n);

export const drop =
  (n: number) =>
  <A>(xs: A[]): A[] =>
    drop_(xs, n);

export const concat =
  <B>(ys: B[]) =>
  <A extends B>(xs: A[]): Array<B> =>
    concat_(xs, ys);

export const all =
  <A>(p: (a: A) => boolean) =>
  (xs: A[]): boolean =>
    xs.every(p);
export const any =
  <A>(p: (a: A) => boolean) =>
  (xs: A[]): boolean =>
    xs.some(p);

export const count =
  <A>(p: (a: A) => boolean): ((xs: A[]) => number) =>
  xs =>
    count_(xs, p);

export const filter: <A>(p: (a: A) => boolean) => (xs: A[]) => A[] = p => xs =>
  filter_(xs, p);

export const map: <A, B>(f: (a: A) => B) => (xs: A[]) => B[] = f => xs =>
  map_(xs, f);

export const tap: <A>(f: (a: A) => unknown) => (xs: A[]) => A[] = f => xs =>
  tap_(xs, f);

export const flatMap: <A, B>(f: (a: A) => B[]) => (xs: A[]) => B[] = f => xs =>
  flatMap_(xs, f);
export const coflatMap: <A, B>(f: (as: A[]) => B) => (xs: A[]) => B[] =
  f => xs =>
    coflatMap_(xs, f);

export const flatten: <A>(xss: A[][]) => A[] = xss => xss.flatMap(id);

export const foldMap: <M>(
  M: Monoid<M>,
) => <A>(f: (a: A) => M) => (xs: A[]) => M = M => f => xs => foldMap_(xs, f, M);

export const tailRecM: <A>(a: A) => <B>(f: (a: A) => Either<A, B>[]) => B[] =
  a => f =>
    tailRecM_(a, f);

export const foldLeft: <A, B>(z: B, f: (b: B, a: A) => B) => (xs: A[]) => B =
  (z, f) => xs =>
    foldLeft_(xs, z, f);

export const foldRight: <A, B>(z: B, f: (a: A, b: B) => B) => (xs: A[]) => B =
  (z, f) => xs =>
    foldRight_(xs, z, f);

export const traverse: <G>(
  G: Applicative<G>,
) => <A, B>(f: (a: A) => Kind<G, [B]>) => (xs: A[]) => Kind<G, [B[]]> =
  G => f => xs =>
    traverse_(G)(xs, f);

export const sequence: <G>(
  G: Applicative<G>,
) => <A>(gs: Kind<G, [A]>[]) => Kind<G, [A[]]> = G => gs =>
  traverse_(G)(gs, id);

// Point-ful operators

export const take_ = <A>(xs: A[], n: number): A[] => xs.slice(0, n);

export const drop_ = <A>(xs: A[], n: number): A[] => xs.slice(n);

export const concat_: <A>(xs: A[], ys: A[]) => A[] = (xs, ys) => xs.concat(ys);

export const all_ = <A>(xs: A[], p: (a: A) => boolean): boolean =>
  xs.every(x => p(x));
export const any_ = <A>(xs: A[], p: (a: A) => boolean): boolean =>
  xs.some(x => p(x));

export const count_ = <A>(xs: A[], p: (a: A) => boolean): number =>
  xs.reduce((c, x) => (p(x) ? c + 1 : c), 0);

export const elem_ = <A>(xs: A[], idx: number): Option<A> =>
  idx >= 0 && idx < xs.length ? Some(xs[idx]) : None;

export const filter_ = <A>(xs: A[], p: (a: A) => boolean): A[] =>
  xs.filter(x => p(x));

export const map_: <A, B>(xs: A[], f: (a: A, i: number) => B) => B[] = (
  xs,
  f,
) => xs.map((x, i) => f(x, i));

export const tap_: <A>(xs: A[], f: (a: A) => unknown) => A[] = (xs, f) =>
  xs.map(x => {
    f(x);
    return x;
  });

export const collect_ = <A, B>(xs: A[], f: (a: A) => Option<B>): B[] => {
  const ys: B[] = [];
  for (let i = 0, len = xs.length; i < len; i++) {
    f(xs[i]).fold(
      () => {},
      y => ys.push(y),
    );
  }
  return ys;
};

export const flatMap_: <A, B>(xs: A[], f: (a: A) => B[]) => B[] = (xs, f) =>
  xs.flatMap(x => f(x));

export const coflatMap_ = <A, B>(xs: A[], f: (as: A[]) => B): B[] => {
  const buf: B[] = [];
  while (xs.length > 0) {
    buf.push(f(xs));
    xs = xs.slice(1);
  }
  return buf;
};

export const tailRecM_ = <S, A>(s: S, f: (s: S) => Either<S, A>[]): A[] => {
  const results: A[] = [];
  let stack = List(f(s)[Symbol.iterator]());

  while (stack.nonEmpty) {
    const [hd, tl] = stack.uncons.get;
    const next = hd.next();

    if (next.done) {
      stack = tl;
    } else if (next.value.isRight) {
      results.push(next.value.get);
    } else {
      stack = tl.prepend(hd).prepend(f(next.value.getLeft)[Symbol.iterator]());
    }
  }

  return results;
};

export const foldMap_ = <M, A>(
  xs: A[],
  f: (a: A, i: number) => M,
  M: Monoid<M>,
): M => foldLeft_(map_(xs, f), M.empty, (x, y) => M.combine_(x, () => y));

export const foldLeft_ = <A, B>(
  xs: A[],
  z: B,
  f: (b: B, a: A, i: number) => B,
): B => xs.reduce((y, x, i) => f(y, x, i), z);

export const foldRight_ = <A, B>(
  xs: A[],
  z: B,
  f: (a: A, b: B, i: number) => B,
): B => xs.reduceRight((b, a, i: number) => f(a, b, i), z);

export const foldRightEval_ = <A, B>(
  xs: A[],
  ez: Eval<B>,
  f: (a: A, eb: Eval<B>, idx: number) => Eval<B>,
): Eval<B> => {
  const sz = xs.length;
  const go = (idx: number): Eval<B> =>
    idx >= sz
      ? ez
      : f(
          xs[idx],
          Eval.defer(() => go(idx + 1)),
          idx,
        );
  return Eval.defer(() => go(0));
};

export const align_ = <A, B>(xs: A[], ys: B[]): Ior<A, B>[] => {
  const results: Ior<A, B>[] = [];
  let i = 0;
  let j = 0;
  const xL = xs.length;
  const yL = ys.length;
  for (; i < xL && j < yL; i++, j++) {
    results.push(Ior.Both(xs[i], ys[j]));
  }
  for (; i < xL; i++) {
    results.push(Ior.Left(xs[i]));
  }
  for (; j < yL; j++) {
    results.push(Ior.Right(ys[j]));
  }
  return results;
};

export const traverse_ =
  <G>(G: Applicative<G>) =>
  <A, B>(xs: A[], f: (a: A, i: number) => Kind<G, [B]>): Kind<G, [B[]]> =>
    G.map_(
      Chain.traverseViaChain(G, arrayFoldableWithIndex())(xs, f),
      ys => ys.toArray,
    );

export const equals_ =
  <AA>(E: Eq<AA>) =>
  <A extends AA>(lhs: A[], rhs: A[]): boolean => {
    if (lhs.length !== rhs.length) return false;
    for (let i = 0, len = lhs.length; i < len; i++) {
      if (E.notEquals(lhs[i], rhs[i])) return false;
    }
    return true;
  };
