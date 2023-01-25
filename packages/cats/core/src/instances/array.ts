// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, Eval, Kind, lazyVal, TyK, TyVar } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Alternative } from '../alternative';
import { Applicative } from '../applicative';
import { Apply } from '../apply';
import { EqK } from '../eq-k';
import { FunctorFilter } from '../functor-filter';
import { FunctorWithIndex } from '../functor-with-index';
import { MonoidK } from '../monoid-k';
import {
  Chain,
  Either,
  Ior,
  List,
  None,
  Option,
  Some,
  Vector,
  View,
} from '../data';
import { FlatMap } from '../flat-map';
import { Monad } from '../monad';
import { FoldableWithIndex } from '../foldable-with-index';
import { TraversableWithIndex } from '../traversable-with-index';
import { TraversableFilter } from '../traversable-filter';
import { Align } from '../align';
import { CoflatMap } from '../coflat-map';
import { Unzip } from '../unzip';
import { Zip } from '../zip';

export const arrayEqK = lazyVal(() => EqK.of<ArrayF>({ liftEq: Eq.Array }));

export const arrayMonoidK = lazyVal(() => {
  const M = Monoid.Array<any>();
  return MonoidK.of<ArrayF>({
    emptyK: () => M.empty,
    combineK_: M.combine_,
    combineKEval_: M.combineEval_,
    algebra: () => M,
  });
});

export const arrayFunctorWithIndex = lazyVal(() =>
  FunctorWithIndex.of<ArrayF, number>({ mapWithIndex_: mapWithIndex }),
);

function mapWithIndex<A, B>(xs: A[], f: (a: A, i: number) => B): B[] {
  return xs.map((x, i) => f(x, i));
}

export const arrayUnzip = lazyVal(() =>
  Unzip.of({
    ...arrayFunctorWithIndex(),
    zip_: zip,
    zipWith_: zipWith,
    unzipWith_: unzipWith,
    unzip,
  }),
);

function zipWith<A, B, C>(xs: A[], ys: B[], f: (a: A, b: B) => C): C[] {
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

function unzipWith<A, B, C>(xs: A[], f: (a: A) => readonly [B, C]): [B[], C[]] {
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

export const arrayAlign = lazyVal(() =>
  Align.of<ArrayF>({ ...arrayFunctorWithIndex(), align_: align }),
);

function align<A, B>(xs: A[], ys: B[]): Ior<A, B>[] {
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

export const arrayFunctorFilter = lazyVal(() =>
  FunctorFilter.of<ArrayF>({
    ...arrayFunctorWithIndex(),
    mapFilter_: collect,
    collect_: collect,
    filter_: filter,
  }),
);

function collect<A, B>(xs: A[], f: (a: A) => Option<B>): B[] {
  const ys: B[] = [];
  for (let i = 0, len = xs.length; i < len; i++) {
    const oy = f(xs[i]);
    if (oy.nonEmpty) ys.push(oy.get);
  }
  return ys;
}

function filter<A>(xs: A[], f: (a: A) => boolean): A[] {
  return xs.filter(x => f(x));
}

export const arrayApply = lazyVal(() =>
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

function map2<A, B, C>(fa: A[], fb: B[], f: (a: A, b: B) => C): C[] {
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

export const arrayApplicative = lazyVal(() =>
  Applicative.of<ArrayF>({
    ...arrayApply(),
    pure,
  }),
);

export const arrayAlternative = lazyVal(() =>
  Alternative.of<ArrayF>({
    ...arrayApplicative(),
    ...arrayMonoidK(),
  }),
);

function pure<A>(x: A): A[] {
  return [x];
}

export const arrayFlatMap = lazyVal(() =>
  FlatMap.of<ArrayF>({
    ...arrayApply(),
    flatMap_: flatMap,
    tailRecM_: tailRecM,
  }),
);

function flatMap<A, B>(xs: A[], f: (a: A) => B[]): B[] {
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

export const arrayMonad = lazyVal(() =>
  Monad.of<ArrayF>({ ...arrayApplicative(), ...arrayFlatMap() }),
);

export const arrayCoflatMap = lazyVal(() =>
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

export const arrayFoldableWithIndex = lazyVal(() =>
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
    view,
    toList: List.fromArray,
    toVector: Vector.fromArray,
  }),
);

function foldLeft<A, B>(xs: A[], z: B, f: (b: B, a: A) => B): B {
  return xs.reduce((b, x) => f(b, x), z);
}

function foldLeftWithIndex<A, B>(
  xs: A[],
  z: B,
  f: (b: B, a: A, i: number) => B,
): B {
  return xs.reduce((b, x, i) => f(b, x, i), z);
}

function foldRight<A, B>(
  xs: A[],
  ez: Eval<B>,
  f: (a: A, eb: Eval<B>) => Eval<B>,
): Eval<B> {
  let idx = 0;
  const sz = xs.length;
  const go: Eval<B> = Eval.defer(() => (idx >= sz ? ez : f(xs[idx++], go)));
  return go;
}

function foldRightWithIndex<A, B>(
  xs: A[],
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

function elem<A>(xs: A[], idx: number): Option<A> {
  return idx < 0 || idx >= xs.length ? None : Some(xs[idx]);
}

function count<A>(xs: A[], f: (x: A) => boolean): number {
  let count = 0;
  for (let i = 0, len = xs.length; i < len; i++) {
    if (f(xs[i])) count++;
  }
  return count;
}
function all<A>(xs: A[], f: (a: A) => boolean): boolean {
  for (let i = 0, len = xs.length; i < len; i++) {
    if (!f(xs[i])) return false;
  }
  return true;
}
function any<A>(xs: A[], f: (a: A) => boolean): boolean {
  for (let i = 0, len = xs.length; i < len; i++) {
    if (f(xs[i])) return true;
  }
  return false;
}
function iterator<A>(xs: A[]): Iterator<A> {
  return xs[Symbol.iterator]();
}
function view<A>(xs: A[]): View<A> {
  return View.build((ez, g) => foldRight(xs, ez, g));
}

export const arrayTraversableWithIndex = lazyVal(() =>
  TraversableWithIndex.of<ArrayF, number>({
    ...arrayFoldableWithIndex(),
    ...arrayFunctorWithIndex(),
    traverseWithIndex_: traverseWithIndex,
  }),
);

const traverseWithIndex =
  <G>(G: Applicative<G>) =>
  <A, B>(xs: A[], f: (a: A, i: number) => Kind<G, [B]>): Kind<G, [B[]]> =>
    G.map_(
      Chain.traverseViaChain(G, arrayFoldableWithIndex())(xs, f),
      xs => xs.toArray,
    );

export const arrayTraversableFilter = lazyVal(() =>
  TraversableFilter.of<ArrayF>({
    ...arrayFoldableWithIndex(),
    ...arrayFunctorFilter(),
    traverseFilter_: traverseFilter,
  }),
);

const traverseFilter =
  <G>(G: Applicative<G>) =>
  <A, B>(xs: A[], f: (a: A) => Kind<G, [Option<B>]>): Kind<G, [B[]]> =>
    G.map_(
      Chain.traverseFilterViaChain(G, arrayFoldableWithIndex())(xs, x => f(x)),
      xs => xs.toArray,
    );

// -- HKT

export interface ArrayF extends TyK<[unknown]> {
  [$type]: TyVar<this, 0>[];
}
