// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, Eval, id, Kind, lazy, TyK, TyVar } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Alternative } from '../alternative';
import { Applicative } from '../applicative';
import { Apply, TraverseStrategy } from '../apply';
import { EqK } from '../eq-k';
import { FunctorFilter } from '../functor-filter';
import { FunctorWithIndex } from '../functor-with-index';
import { MonoidK } from '../monoid-k';
import { FlatMap } from '../flat-map';
import { Monad } from '../monad';
import { FoldableWithIndex } from '../foldable-with-index';
import { TraversableWithIndex } from '../traversable-with-index';
import { TraversableFilter } from '../traversable-filter';
import { CoflatMap } from '../coflat-map';
import { Unzip } from '../unzip';
import { Unalign } from '../unalign';
import { Either, Ior, isIdentityTC, None, Option, Some } from '../data';

export const arrayEqK = lazy(() => EqK.of<ArrayF>({ liftEq: Eq.Array }));

export const arrayMonoidK = lazy(() => {
  const M = Monoid.Array<any>();
  return MonoidK.of<ArrayF>({
    emptyK: () => M.empty,
    combineK_: M.combine_,
    combineKEval_: M.combineEval_,
    algebra: () => M,
  });
});

export const arrayFunctorWithIndex = lazy(() =>
  FunctorWithIndex.of<ArrayF, number>({ mapWithIndex_: mapWithIndex }),
);

function mapWithIndex<A, B>(xs: readonly A[], f: (a: A, i: number) => B): B[] {
  const ys = new Array<B>(xs.length);
  for (let i = 0, len = xs.length; i < len; i++) {
    ys[i] = f(xs[i], i);
  }
  return ys;
}

export const arrayUnzip = lazy(() =>
  Unzip.of({
    ...arrayFunctorWithIndex(),
    zip_: zip,
    zipWith_: zipWith,
    unzipWith_: unzipWith,
    unzip,
  }),
);

function zipWith<A, B, C>(
  xs: readonly A[],
  ys: readonly B[],
  f: (a: A, b: B) => C,
): C[] {
  const sz = Math.min(xs.length, ys.length);
  const cs = new Array<C>(sz);
  for (let i = 0; i < sz; i++) {
    cs[i] = f(xs[i], ys[i]);
  }
  return cs;
}
function zip<A, B>(xs: A[], ys: B[]): [A, B][] {
  const sz = Math.min(xs.length, ys.length);
  const cs = new Array<[A, B]>(sz);
  for (let i = 0; i < sz; i++) {
    cs[i] = [xs[i], ys[i]];
  }
  return cs;
}

function unzipWith<A, B, C>(
  xs: readonly A[],
  f: (a: A) => readonly [B, C],
): [B[], C[]] {
  const sz = xs.length;
  const bs = new Array<B>(sz);
  const cs = new Array<C>(sz);
  for (let i = 0; i < sz; i++) {
    const bc = f(xs[i]);
    bs[i] = bc[0];
    cs[i] = bc[1];
  }
  return [bs, cs];
}
function unzip<A, B>(xs: (readonly [A, B])[]): [A[], B[]] {
  const sz = xs.length;
  const as = new Array<A>(sz);
  const bs = new Array<B>(sz);
  for (let i = 0; i < sz; i++) {
    const ab = xs[i];
    as[i] = ab[0];
    bs[i] = ab[1];
  }
  return [as, bs];
}

export const arrayUnalign = lazy(() =>
  Unalign.of<ArrayF>({
    ...arrayFunctorWithIndex(),
    align_: align,
    alignWith_: alignWith,
    unalignWith_: unalignWith,
  }),
);

function align<A, B>(xs: readonly A[], ys: readonly B[]): Ior<A, B>[] {
  let i = 0;
  const abs: Ior<A, B>[] = [];

  for (let len = Math.min(xs.length, ys.length); i < len; i++) {
    abs.push(Ior.Both(xs[i], ys[i]));
  }
  while (i < xs.length) {
    abs.push(Ior.Left(xs[i++]));
  }
  while (i < ys.length) {
    abs.push(Ior.Right(ys[i++]));
  }
  return abs;
}

function alignWith<A, B, C>(
  xs: readonly A[],
  ys: readonly B[],
  f: (ior: Ior<A, B>) => C,
): C[] {
  let i = 0;
  const cs: C[] = [];

  for (let len = Math.min(xs.length, ys.length); i < len; i++) {
    cs.push(f(Ior.Both(xs[i], ys[i])));
  }
  while (i < xs.length) {
    cs.push(f(Ior.Left(xs[i++])));
  }
  while (i < ys.length) {
    cs.push(f(Ior.Right(ys[i++])));
  }
  return cs;
}

function unalignWith<A, B, C>(
  xs: readonly A[],
  f: (a: A) => Ior<B, C>,
): [B[], C[]] {
  const bs: B[] = [];
  const cs: C[] = [];
  const l = (b: B) => bs.push(b);
  const r = (c: C) => cs.push(c);
  const lr = (b: B, c: C) => {
    bs.push(b);
    cs.push(c);
  };
  for (let i = 0, len = xs.length; i < len; i++) {
    f(xs[i]).fold(l, r, lr);
  }
  return [bs, cs];
}

export const arrayFunctorFilter = lazy(() =>
  FunctorFilter.of<ArrayF>({
    ...arrayFunctorWithIndex(),
    mapFilter_: collect,
    collect_: collect,
    filter_: filter,
  }),
);

function collect<A, B>(xs: readonly A[], f: (a: A) => Option<B>): B[] {
  const ys: B[] = [];
  for (let i = 0, len = xs.length; i < len; i++) {
    const oy = f(xs[i]);
    if (oy.nonEmpty) ys.push(oy.get);
  }
  return ys;
}

function filter<A>(xs: readonly A[], f: (a: A) => boolean): A[] {
  return xs.filter(x => f(x));
}

export const arrayApply = lazy(() =>
  Apply.of<ArrayF>({
    ...arrayFunctorWithIndex(),
    ap_: ap,
    map2_:
      <A, B>(xs: A[], ys: B[]) =>
      <C>(f: (a: A, b: B) => C) =>
        map2(xs, ys, f),
    map2Eval_:
      <A, B>(xs: A[], eys: Eval<B[]>) =>
      <C>(f: (a: A, b: B) => C) =>
        xs.length === 0 ? Eval.now([]) : eys.map(ys => map2(xs, ys, f)),
  }),
);

function ap<A, B>(ff: ((a: A) => B)[], fa: A[]): B[] {
  const len1 = ff.length;
  const len2 = fa.length;
  const zs: B[] = new Array(len1 * len2);
  let idx = 0;
  for (let i = 0; i < len1; i++) {
    for (let j = 0; j < len2; j++) {
      zs[idx++] = ff[i](fa[j]);
    }
  }
  return zs;
}

function map2<A, B, C>(
  fa: readonly A[],
  fb: readonly B[],
  f: (a: A, b: B) => C,
): C[] {
  const len1 = fa.length;
  const len2 = fb.length;
  const zs: C[] = new Array(len1 * len2);
  let idx = 0;
  for (let i = 0; i < len1; i++) {
    for (let j = 0; j < len2; j++) {
      zs[idx++] = f(fa[i], fb[j]);
    }
  }
  return zs;
}

export const arrayApplicative = lazy(() =>
  Applicative.of<ArrayF>({
    ...arrayApply(),
    pure,
  }),
);

export const arrayAlternative = lazy(() =>
  Alternative.of<ArrayF>({
    ...arrayApplicative(),
    ...arrayMonoidK(),
  }),
);

function pure<A>(x: A): A[] {
  return [x];
}

export const arrayFlatMap = lazy(() =>
  FlatMap.of<ArrayF>({
    ...arrayApply(),
    flatMap_: flatMap,
    tailRecM_: tailRecM,
  }),
);

function flatMap<A, B>(xs: readonly A[], f: (a: A) => readonly B[]): B[] {
  return xs.flatMap(x => f(x));
}

function tailRecM<S, A>(s: S, f: (s: S) => Either<S, A>[]): A[] {
  const stack: Iterator<Either<S, A>>[] = [f(s)[Symbol.iterator]()];
  const as: A[] = [];

  let ptr = 0;
  while (ptr >= 0) {
    const xhd = stack[ptr].next();

    if (xhd.done) {
      stack.pop();
      ptr--;
      continue;
    }

    const nx = xhd.value;
    if (nx.isLeft) {
      stack.push(f(nx.getLeft)[Symbol.iterator]());
      ptr++;
    } else {
      as.push(nx.get);
    }
  }

  return as;
}

export const arrayMonad = lazy(() =>
  Monad.of<ArrayF>({ ...arrayApplicative(), ...arrayFlatMap() }),
);

export const arrayCoflatMap = lazy(() =>
  CoflatMap.of<ArrayF>({ ...arrayFunctorWithIndex(), coflatMap_: coflatMap }),
);

function coflatMap<A, B>(xs: A[], f: (xs: A[]) => B): B[] {
  const bs: B[] = [];
  while (xs.length > 0) {
    bs.push(f(xs));
    xs = xs.slice(1);
  }
  return bs;
}

export const arrayFoldableWithIndex = lazy(() =>
  FoldableWithIndex.of<ArrayF, number>({
    foldLeft_: foldLeft,
    foldLeftWithIndex_: foldLeftWithIndex,
    foldRight_: foldRight,
    foldRightWithIndex_: foldRightWithIndex,
    elem_: elem,
    all_: all,
    any_: any,
    count_: count,
    iterator,
    toArray: id,
  }),
);

function foldLeft<A, B>(xs: readonly A[], z: B, f: (b: B, a: A) => B): B {
  return xs.reduce((b, x) => f(b, x), z);
}

function foldLeftWithIndex<A, B>(
  xs: readonly A[],
  z: B,
  f: (b: B, a: A, i: number) => B,
): B {
  return xs.reduce((b, x, i) => f(b, x, i), z);
}

function foldRight<A, B>(
  xs: readonly A[],
  ez: Eval<B>,
  f: (a: A, eb: Eval<B>) => Eval<B>,
): Eval<B> {
  let idx = 0;
  const sz = xs.length;
  const go: Eval<B> = Eval.defer(() => (idx >= sz ? ez : f(xs[idx++], go)));
  return go;
}

function foldRightWithIndex<A, B>(
  xs: readonly A[],
  ez: Eval<B>,
  f: (a: A, eb: Eval<B>, i: number) => Eval<B>,
): Eval<B> {
  let idx = 0;
  const sz = xs.length;
  const go: Eval<B> = Eval.defer(() =>
    idx >= sz ? ez : f(xs[idx], go, idx++),
  );
  return go;
}

function elem<A>(xs: readonly A[], idx: number): Option<A> {
  return idx < 0 || idx >= xs.length ? None : Some(xs[idx]);
}

function count<A>(xs: readonly A[], f: (x: A) => boolean): number {
  let count = 0;
  for (let i = 0, len = xs.length; i < len; i++) {
    if (f(xs[i])) count++;
  }
  return count;
}
function all<A>(xs: readonly A[], f: (a: A) => boolean): boolean {
  for (let i = 0, len = xs.length; i < len; i++) {
    if (!f(xs[i])) return false;
  }
  return true;
}
function any<A>(xs: readonly A[], f: (a: A) => boolean): boolean {
  for (let i = 0, len = xs.length; i < len; i++) {
    if (f(xs[i])) return true;
  }
  return false;
}
function iterator<A>(xs: readonly A[]): Iterator<A> {
  return xs[Symbol.iterator]();
}

export const arrayTraversableWithIndex = lazy(() =>
  TraversableWithIndex.of<ArrayF, number>({
    ...arrayFoldableWithIndex(),
    ...arrayFunctorWithIndex(),
    traverseWithIndex_: traverseWithIndex,
  }),
);

const traverseWithIndex =
  <G>(G: Applicative<G>) =>
  <A, B>(
    xs: readonly A[],
    f: (a: A, i: number) => Kind<G, [B]>,
  ): Kind<G, [B[]]> =>
    xs.length === 0
      ? G.pure([])
      : isIdentityTC(G)
      ? (mapWithIndex(xs, f) as any)
      : Apply.TraverseStrategy(G)(Rhs => traverseWithIndexImpl(G, Rhs, xs, f));

const traverseWithIndexImpl = <G, Rhs, A, B>(
  G: Applicative<G>,
  Rhs: TraverseStrategy<G, Rhs>,
  xs: readonly A[],
  f: (a: A, i: number) => Kind<G, [B]>,
): Kind<G, [B[]]> => {
  // Max width of the tree -- max depth log_128(c.size)
  const width = 128;

  const loop = (
    start: number,
    end: number,
  ): Kind<Rhs, [Kind<G, [Concat<B>]>]> => {
    if (end - start <= width) {
      // We've entered leaves of the tree
      let first = Rhs.toRhs(() => G.map_(f(xs[end - 1], end - 1), singleton));
      for (let idx = end - 2; start <= idx; idx--) {
        const a = xs[idx];
        const right = first;
        const idx0 = idx;
        first = Rhs.defer(() => Rhs.map2Rhs(f(a, idx0), right)(cons));
      }
      return Rhs.map(first, single);
    } else {
      const step = ((end - start) / width) | 0;

      let fchain = Rhs.defer(() => loop(start, start + step));

      for (
        let start0 = start + step, end0 = start0 + step;
        start0 < end;
        start0 += step, end0 += step
      ) {
        const start1 = start0;
        const end1 = Math.min(end, end0);
        const right = Rhs.defer(() => loop(start1, end1));
        fchain = Rhs.map2(fchain, right)(concat);
      }
      return fchain;
    }
  };

  return G.map_(Rhs.toG(loop(0, xs.length)), xs => concatCopyToArray(xs, []));
};

export const arrayTraversableFilter = lazy(() =>
  TraversableFilter.of<ArrayF>({
    ...arrayFoldableWithIndex(),
    ...arrayFunctorFilter(),
    traverseFilter_: traverseFilter,
  }),
);

const traverseFilter =
  <G>(G: Applicative<G>) =>
  <A, B>(xs: readonly A[], f: (a: A) => Kind<G, [Option<B>]>): Kind<G, [B[]]> =>
    xs.length === 0
      ? G.pure([])
      : isIdentityTC(G)
      ? (collect(xs, f as any) as any)
      : Apply.TraverseStrategy(G)(Rhs => traverseFilterImpl(G, Rhs, xs, f));

const traverseFilterImpl = <G, Rhs, A, B>(
  G: Applicative<G>,
  Rhs: TraverseStrategy<G, Rhs>,
  xs: readonly A[],
  f: (a: A) => Kind<G, [Option<B>]>,
): Kind<G, [B[]]> => {
  // Max width of the tree -- max depth log_128(c.size)
  const width = 128;

  const loop = (
    start: number,
    end: number,
  ): Kind<Rhs, [Kind<G, [Concat<B>]>]> => {
    if (end - start <= width) {
      // We've entered leaves of the tree
      let first = Rhs.toRhs(() => G.map_(f(xs[end - 1]), singletonFilter));
      for (let idx = end - 2; start <= idx; idx--) {
        const a = xs[idx];
        const right = first;
        first = Rhs.defer(() => Rhs.map2Rhs(f(a), right)(consFilter));
      }
      return Rhs.map(first, single);
    } else {
      const step = ((end - start) / width) | 0;

      let fchain = Rhs.defer(() => loop(start, start + step));

      for (
        let start0 = start + step, end0 = start0 + step;
        start0 < end;
        start0 += step, end0 += step
      ) {
        const start1 = start0;
        const end1 = Math.min(end, end0);
        const right = Rhs.defer(() => loop(start1, end1));
        fchain = Rhs.map2(fchain, right)(concat);
      }
      return fchain;
    }
  };

  return G.map_(Rhs.toG(loop(0, xs.length)), xs => concatCopyToArray(xs, []));
};

type Cons<A> = { tag: 0 } | { tag: 1; head: A; tail: Cons<A> };

function singleton<A>(head: A): Cons<A> {
  return { tag: 1, head, tail: { tag: 0 } };
}
function singletonFilter<A>(head: Option<A>): Cons<A> {
  return head.nonEmpty
    ? { tag: 1, head: head.get, tail: { tag: 0 } }
    : { tag: 0 };
}
function cons<A>(head: A, tail: Cons<A>): Cons<A> {
  return { tag: 1, head, tail };
}
function consFilter<A>(head: Option<A>, tail: Cons<A>): Cons<A> {
  return head.nonEmpty ? { tag: 1, head: head.get, tail } : tail;
}
function consCopyToArray<A>(xs: Cons<A>, ys: A[]): void {
  while (xs.tag !== 0) {
    ys.push(xs.head);
    xs = xs.tail;
  }
}

type Concat<A> =
  | { tag: 0 }
  | { tag: 1; value: Cons<A> }
  | { tag: 2; lhs: Concat<A>; rhs: Concat<A> };

function single<A>(value: Cons<A>): Concat<A> {
  return { tag: 1, value };
}

function concat<A>(lhs: Concat<A>, rhs: Concat<A>): Concat<A> {
  return { tag: 2, lhs, rhs };
}

function concatCopyToArray<A>(xs: Concat<A>, ys: A[]): A[] {
  switch (xs.tag) {
    case 0:
      return ys;
    case 1:
      consCopyToArray(xs.value, ys);
      return ys;
    case 2:
      concatCopyToArray(xs.lhs, ys);
      concatCopyToArray(xs.rhs, ys);
      return ys;
  }
}

// -- HKT

export interface ArrayF extends TyK<[unknown]> {
  [$type]: TyVar<this, 0>[];
}
