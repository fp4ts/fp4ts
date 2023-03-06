// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { fst, snd, tupled } from '@fp4ts/core';
import { Option, Some } from '@fp4ts/cats';
import { List } from '@fp4ts/collections';

// https://hackage.haskell.org/package/Agda-2.6.2.2/docs/src/Agda.Utils.Permutation.html#topoSortM
export const toposort = <A>(
  isParent: (x: A, y: A) => boolean,
  xs: List<A>,
): Option<List<A>> => {
  const nodes = xs.zipWithIndex.toArray;
  const parents = (x: A) => nodes.filter(([y]) => isParent(y, x)).map(snd);
  const g = nodes.map(([x, i]) => tupled(i, parents(x)));

  const go = (g: [number, number[]][]): Option<List<number>> => {
    if (g.length === 0)
      // Cycle found
      return Some(List.empty);

    const xs = g.filter(([, ds]) => ds.length === 0).map(fst);
    return Option(xs[0]) //
      .flatMap(x =>
        go(remove(x, g)) //
          .map(ys => ys.cons(x)),
      );
  };

  const remove = (x: number, g: [number, number[]][]) =>
    g
      .filter(([y]) => x !== y)
      .map(([y, ys]): [number, number[]] => [y, ys.filter(yy => yy !== x)]);

  return go(g).map(ys => ys.map(idx => nodes[idx][0]));
};
