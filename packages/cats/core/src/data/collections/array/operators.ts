import { Kind, id } from '@cats4ts/core';
import { Monoid } from '../../../monoid';
import { Applicative } from '../../../applicative';

import { Option } from '../../option';
import { Either } from '../../either';

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

export const flatTraverse: <G>(
  G: Applicative<G>,
) => <A, B>(f: (a: A) => Kind<G, [B[]]>) => (xs: A[]) => Kind<G, [B[]]> =
  G => f => xs =>
    flatTraverse_(G, xs, f);

export const flatSequence: <G>(
  G: Applicative<G>,
) => <A>(xgs: Kind<G, [A[]]>[]) => Kind<G, [A[]]> = G => xgs =>
  flatTraverse_(G, xgs, id);

// Point-ful operators

export const take_ = <A>(xs: A[], n: number): A[] => xs.slice(0, n);

export const drop_ = <A>(xs: A[], n: number): A[] => xs.slice(n);

export const concat_: <A>(xs: A[], ys: A[]) => A[] = (xs, ys) => xs.concat(ys);

export const all_ = <A>(xs: A[], p: (a: A) => boolean): boolean => xs.every(p);
export const any_ = <A>(xs: A[], p: (a: A) => boolean): boolean => xs.some(p);

export const count_ = <A>(xs: A[], p: (a: A) => boolean): number =>
  xs.reduce((c, x) => (p(x) ? c + 1 : c), 0);

export const filter_ = <A>(xs: A[], p: (a: A) => boolean): A[] => xs.filter(p);

export const map_: <A, B>(xs: A[], f: (a: A) => B) => B[] = (xs, f) =>
  xs.map(f);

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
  xs.flatMap(f);

export const tailRecM_ = <A, B>(a: A, f: (a: A) => Either<A, B>[]): B[] => {
  const results: B[] = [];
  const stack: Either<A, B>[] = f(a);

  while (stack.length > 0) {
    const head = stack.pop()!;
    head.fold(
      a => stack.push(...f(a).reverse()),
      b => results.push(b),
    );
  }

  return results;
};

export const foldMap_ = <M, A>(xs: A[], f: (a: A) => M, M: Monoid<M>): M =>
  foldLeft_(map_(xs, f), M.empty, (x, y) => M.combine_(x, () => y));

export const foldLeft_ = <A, B>(xs: A[], z: B, f: (b: B, a: A) => B): B =>
  xs.reduce(f, z);

export const foldRight_ = <A, B>(xs: A[], z: B, f: (a: A, b: B) => B): B =>
  xs.reduceRight((b, a) => f(a, b), z);

export const traverse_ =
  <G>(G: Applicative<G>) =>
  <A, B>(xs: A[], f: (a: A) => Kind<G, [B]>): Kind<G, [B[]]> =>
    // TODO: Fix
    xs.reduceRight(
      (gbs: Kind<G, [B[]]>, x) => G.map2_(gbs, f(x))((bs, b) => [...bs, b]),
      G.pure([] as B[]),
    );

export const flatTraverse_ = <G, A, B>(
  G: Applicative<G>,
  xs: A[],
  f: (a: A) => Kind<G, [B[]]>,
): Kind<G, [B[]]> =>
  xs.reduce(
    (gbs: Kind<G, [B[]]>, x) => G.map2_(gbs, f(x))((bs, b) => [...bs, ...b]),
    G.pure([] as B[]),
  );
