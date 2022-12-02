// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, cached, Kind, tupled, TyK, TyVar } from '@fp4ts/core';
import { Functor, Monoid } from '@fp4ts/cats';
import { RWSTF, RWST } from '@fp4ts/cats-mtl';
import {
  Reader,
  ReaderF,
  State,
  StateF,
  Writer,
  WriterF,
} from '@fp4ts/fused-core';
import { Algebra, Eff, Handler } from '@fp4ts/fused-kernel';

function RWSTAlgebra<R, W, S, Sig, F>(
  F: Algebra<Sig, F>,
  W: Monoid<W>,
): Algebra<
  | { reader: $<ReaderF, [R]> }
  | { writer: $<WriterF, [W]> }
  | { state: $<StateF, [S]> }
  | Sig,
  $<RWSTF, [R, W, S, F]>
> {
  type Sig_ =
    | { reader: $<ReaderF, [R]> }
    | { writer: $<WriterF, [W]> }
    | { state: $<StateF, [S]> }
    | Sig;
  const buildCtxFunctor = cached(<H>(H: Functor<H>) =>
    Functor.compose(tupleL3Functor<S, W>(), H),
  );
  return Algebra.of<Sig_, $<RWSTF, [R, W, S, F]>>({
    eff: (<H, G, A>(
      H: Functor<H>,
      hdl: Handler<H, G, $<RWSTF, [R, W, S, F]>>,
      eff: Eff<Sig_, G, A>,
      hu: Kind<H, [void]>,
    ) => {
      switch (eff.tag) {
        case 'reader': {
          const re = eff.eff as Reader<R, G, A>;
          return re.foldMap<[$<RWSTF, [R, W, S, F]>, H]>(
            () => g => (r, s, w) =>
              g(
                H.map_(hu, () => r),
                s,
                w,
              ),
            (ga, f) => g => (r, s, w) =>
              hdl(H.map_(hu, () => ga))(g)(f(r), s, w),
          );
        }

        case 'state': {
          const se = eff.eff as State<S, G, A>;
          return se.foldMap<[$<RWSTF, [R, W, S, F]>, H]>(
            () => g => (r, s, w) =>
              g(
                H.map_(hu, () => s),
                s,
                w,
              ),
            s => g => (r, _, w) => g(hu, s, w),
          );
        }

        case 'writer': {
          const we = eff.eff as Writer<W, G, A>;
          return we.foldMap<[$<RWSTF, [R, W, S, F]>, H]>(
            w2 => g => (r, s, w1) =>
              g(
                hu,
                s,
                W.combine_(w1, () => w2),
              ),
            ga => g =>
              hdl(H.map_(hu, () => ga))((ha, s, w) =>
                g(
                  H.map_(ha, a => [a, w]),
                  s,
                  w,
                ),
              ),
            (ga, f) => g =>
              hdl(H.map_(hu, () => ga))((ha, s, w) => g(ha, s, f(w))),
          );
        }

        default: {
          const oe = eff as Eff<Sig, G, A>;
          return <X>(g: (ha: Kind<H, [A]>, s: S, w: W) => Kind<F, [X]>) =>
            (r, s, w) =>
              F.flatMap_(
                F.eff(
                  buildCtxFunctor(H),
                  ([hga, s, w]) =>
                    hdl(hga)((ha, s, w) => F.pure(tupled(ha, s, w)))(r, s, w),
                  oe,
                  [hu, s, w],
                ),
                ([ha, s, w]) => g(ha, s, w),
              );
        }
      }
    }) as Algebra<Sig_, $<RWSTF, [R, W, S, F]>>['eff'],

    ...RWST.Monad<R, W, S, F>(F),
  });
}

export const RWSTC = Object.freeze({
  Algebra: RWSTAlgebra,
});

interface TupleL3F<B, C> extends TyK<[unknown]> {
  [$type]: [TyVar<this, 0>, B, C];
}
const tupleL3Functor = <B, C>(): Functor<TupleL3F<B, C>> =>
  Functor.of({ map_: ([x, b, c], f) => [f(x), b, c] });
