// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Applicative, Contravariant, Traversable } from '@fp4ts/cats-core';
import { Kind } from '@fp4ts/core';
import { Conjoined, Indexable, IndexPreservingFold } from '@fp4ts/optics-core';
import { IndexPreservingOptic } from '@fp4ts/optics-core/lib/internal';

const ipfold = <S, A>(
  apply: <F, P, RepF, CorepF>(
    F: Contravariant<F> & Applicative<F>,
    P: Conjoined<P, RepF, CorepF>,
  ) => (
    pafb: Kind<P, [A, Kind<F, [never]>]>,
  ) => Kind<P, [S, Kind<F, [unknown]>]>,
): IndexPreservingFold<S, A> => new IndexPreservingOptic(apply as any) as any;

export const worded = ipfold(
  <F, P, RepF, CorepF>(
    F: Contravariant<F> & Applicative<F>,
    P: Conjoined<P, RepF, CorepF>,
  ) => {
    if ((P as any) === Indexable.Function1) {
      const traverse = Traversable.Array.traverse_(F);
      return ((pafb: (a: string) => Kind<F, [never]>) => (s: string) =>
        traverse(s.split(ws), pafb)) as any;
    } else if ((P as any) === Indexable.Indexed<any>()) {
      const traverse = Traversable.Array.traverse_(F);
      return ((pafb: (a: string, i: unknown) => Kind<F, [never]>) =>
        (s: string, i: unknown) =>
          traverse(s.split(ws), a => pafb(a, i))) as any;
    }
    const traverse = Traversable.Array.traverse_<[RepF, F]>(
      Applicative.compose(P.F, F),
    );
    return (
      pafb: Kind<P, [string, Kind<F, [never]>]>,
    ): Kind<P, [string, Kind<F, [unknown]>]> =>
      P.tabulate((s: string) => traverse(s.split(ws), P.sieve(pafb)));
  },
) as IndexPreservingFold<string, string>;

export const lined = ipfold(
  <F, P, RepF, CorepF>(
    F: Contravariant<F> & Applicative<F>,
    P: Conjoined<P, RepF, CorepF>,
  ) => {
    if ((P as any) === Indexable.Function1) {
      const traverse = Traversable.Array.traverse_(F);
      return ((pafb: (a: string) => Kind<F, [never]>) => (s: string) =>
        traverse(s.split(nl), pafb)) as any;
    } else if ((P as any) === Indexable.Indexed<any>()) {
      const traverse = Traversable.Array.traverse_(F);
      return ((pafb: (a: string, i: unknown) => Kind<F, [never]>) =>
        (s: string, i: unknown) =>
          traverse(s.split(nl), a => pafb(a, i))) as any;
    }

    const traverse = Traversable.Array.traverse_<[RepF, F]>(
      Applicative.compose(P.F, F),
    );
    return (
      pafb: Kind<P, [string, Kind<F, [never]>]>,
    ): Kind<P, [string, Kind<F, [unknown]>]> =>
      P.tabulate((s: string) => traverse(s.split(nl), P.sieve(pafb)));
  },
) as IndexPreservingFold<string, string>;

const ws = /\s+/;
const nl = /(\r?\n)+/;
