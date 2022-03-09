// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Map, None, Option, Ord, Some } from '@fp4ts/cats';
import { Lens } from '../lens';

export class At<S, I, A> {
  public constructor(public readonly at: (i: I) => Lens<S, A>) {}

  public static readonly Map = <K, V>(O: Ord<K>): At<Map<K, V>, K, Option<V>> =>
    new At(
      k =>
        new Lens(
          m => m.lookup(O, k),
          ov => m =>
            ov.fold(
              () => m.remove(O, k),
              v => m.insert(O, k, v),
            ),
        ),
    );

  public static readonly Record = <A>(): At<
    Record<string, A>,
    string,
    Option<A>
  > =>
    new At(
      k =>
        new Lens(
          xs => (k in xs ? Some(xs[k]) : None),
          ox => m =>
            ox.fold(
              () => {
                const { [k]: _, ...rest } = m;
                return rest;
              },
              v => ({ ...m, [k]: v }),
            ),
        ),
    );
}
