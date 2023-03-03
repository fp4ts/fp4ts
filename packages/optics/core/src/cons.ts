// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  ArrayF,
  LazyList,
  LazyListF,
  Left,
  List,
  ListF,
  Right,
  Seq,
  SeqF,
  Vector,
  VectorF,
} from '@fp4ts/cats';
import { Kind, lazy } from '@fp4ts/core';
import { PPrism, Prism, prism } from './prism';

export interface _Cons<F> {
  <A, B>(): PPrism<
    Kind<F, [A]>,
    Kind<F, [B]>,
    [A, Kind<F, [A]>],
    [B, Kind<F, [B]>]
  >;
  <A>(): Prism<Kind<F, [A]>, [A, Kind<F, [A]>]>;
}

export const _Cons = Object.freeze({
  Array: lazy(<A, B>() =>
    prism<A[], B[], [A, A[]], [B, B[]]>(
      xs => (xs.length <= 0 ? Left([]) : Right([xs[0], xs.slice(1)])),
      ([x, xs]) => [x, ...xs],
    ),
  ) as _Cons<ArrayF>,

  List: lazy(<A, B>() =>
    prism<List<A>, List<B>, [A, List<A>], [B, List<B>]>(
      xs => (xs.isEmpty ? Left(List.empty) : Right([xs.head, xs.tail])),
      ([h, tl]) => tl.cons(h),
    ),
  ) as _Cons<ListF>,

  LazyList: lazy(<A, B>() =>
    prism<LazyList<A>, LazyList<B>, [A, LazyList<A>], [B, LazyList<B>]>(
      xs => (xs.isEmpty ? Left(LazyList.empty) : Right([xs.head, xs.tail])),
      ([h, tl]) => tl.cons(h),
    ),
  ) as _Cons<LazyListF>,

  Seq: lazy(<A, B>() =>
    prism<Seq<A>, Seq<B>, [A, Seq<A>], [B, Seq<B>]>(
      xs => (xs.isEmpty ? Left(Seq.empty) : Right([xs.head, xs.tail])),
      ([h, tl]) => tl.prepend(h),
    ),
  ) as _Cons<SeqF>,

  Vector: lazy(<A, B>() =>
    prism<Vector<A>, Vector<B>, [A, Vector<A>], [B, Vector<B>]>(
      xs => (xs.isEmpty ? Left(Vector.empty) : Right([xs.head, xs.tail])),
      ([h, tl]) => tl.prepend(h),
    ),
  ) as _Cons<VectorF>,
});
