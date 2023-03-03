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

export interface _Snoc<F> {
  <A, B>(): PPrism<
    Kind<F, [A]>,
    Kind<F, [B]>,
    [Kind<F, [A]>, A],
    [Kind<F, [B]>, B]
  >;
  <A>(): Prism<Kind<F, [A]>, [Kind<F, [A]>, A]>;
}

export const _Snoc = Object.freeze({
  Array: lazy(<A, B>() =>
    prism<A[], B[], [A[], A], [B[], B]>(
      xs =>
        xs.length <= 0 ? Left([]) : Right([xs.slice(0, -1), xs[xs.length - 1]]),
      ([xs, x]) => [...xs, x],
    ),
  ) as _Snoc<ArrayF>,

  List: lazy(<A, B>() =>
    prism<List<A>, List<B>, [List<A>, A], [List<B>, B]>(
      xs => (xs.isEmpty ? Left(List.empty) : Right([xs.init, xs.last])),
      ([ini, l]) => ini.append(l),
    ),
  ) as _Snoc<ListF>,

  LazyList: lazy(<A, B>() =>
    prism<LazyList<A>, LazyList<B>, [LazyList<A>, A], [LazyList<B>, B]>(
      xs => (xs.isEmpty ? Left(LazyList.empty) : Right([xs.init, xs.last])),
      ([ini, l]) => ini.append(l),
    ),
  ) as _Snoc<LazyListF>,

  Seq: lazy(<A, B>() =>
    prism<Seq<A>, Seq<B>, [Seq<A>, A], [Seq<B>, B]>(
      xs => (xs.isEmpty ? Left(Seq.empty) : Right([xs.init, xs.last])),
      ([ini, l]) => ini.append(l),
    ),
  ) as _Snoc<SeqF>,

  Vector: lazy(<A, B>() =>
    prism<Vector<A>, Vector<B>, [Vector<A>, A], [Vector<B>, B]>(
      xs => (xs.isEmpty ? Left(Vector.empty) : Right([xs.init, xs.last])),
      ([ini, l]) => ini.append(l),
    ),
  ) as _Snoc<VectorF>,
});
