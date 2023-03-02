// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Contravariant, Functor } from '@fp4ts/cats';
import { F1, Kind } from '@fp4ts/core';
import { MonadReader, MonadState, MonadWriter } from '@fp4ts/mtl';
import {
  Conjoined,
  Function1Indexable,
  Indexable,
  IndexedOptic,
  IndexPreservingOptic,
  Optic,
  Settable,
} from './internal';

export interface PSetter<in S, out T, out A, in B> extends Optic<S, T, A, B> {
  readonly runOptic: <F>(
    F: Settable<F>,
    P: Function1Indexable,
  ) => (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]>;
}

export type Setter<S, A> = PSetter<S, S, A, A>;

export interface IndexedPSetter<out I, in S, out T, out A, in B>
  extends IndexedOptic<I, S, T, A, B>,
    PSetter<S, T, A, B> {
  readonly runOptic: <F, P, RepF, CorepF>(
    F: Settable<F>,
    P: Indexable<P, I, RepF, CorepF>,
  ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => (s: S) => Kind<F, [T]>;

  readonly compose: IndexedOptic<I, S, T, A, B>['compose'];
}

export type IndexedSetter<I, S, A> = IndexedPSetter<I, S, S, A, A>;

export interface IndexPreservingPSetter<in S, out T, out A, in B>
  extends IndexPreservingOptic<S, T, A, B>,
    PSetter<S, T, A, B> {
  readonly runOptic: <F, P>(
    F: Settable<F>,
    P: Conjoined<P, any, any>,
  ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => Kind<P, [S, Kind<F, [T]>]>;

  readonly compose: IndexPreservingOptic<S, T, A, B>['compose'];
}

export type IndexPreservingSetter<S, A> = IndexPreservingPSetter<S, S, A, A>;

// -- Constructors

export function sets<S, T, A, B>(
  k: (f: (a: A) => B) => (s: S) => T,
): IndexPreservingPSetter<S, T, A, B> {
  return mkIxPSetter(
    <F, P, RepF, CorepF>(F: Settable<F>, P: Conjoined<P, RepF, CorepF>) => {
      if ((P as any) === Indexable.Function1) {
        const tainted = F.taintedDot(P);
        const untainted = F.untaintedDot(P);
        return ((f: (a: A) => Kind<F, [B]>) =>
          tainted(k(untainted(f as any) as any) as any)) as any;
      }
      return (pafb: Kind<P, [A, Kind<F, [B]>]>) =>
        P.cotabulate((ws: Kind<CorepF, [S]>) =>
          F.pure(
            k(a => F.untainted(P.cosieve(pafb)(P.C.map_(ws, _ => a))))(
              P.C.extract(ws),
            ),
          ),
        );
    },
  );
}

export function isets<I, S, T, A, B>(
  k: (f: (a: A, i: I) => B) => (s: S) => T,
): IndexedPSetter<I, S, T, A, B> {
  return mkIxSetter(
    <F, P, RepF, CorepF>(F: Settable<F>, P: Indexable<P, I, RepF, CorepF>) => {
      const tainted = F.taintedDot(Indexable.Function1);
      const untainted = F.untaintedDot(P);
      return (pafb: Kind<P, [A, Kind<F, [B]>]>) =>
        tainted(k(P.indexed(P.tabulate(P.sieve(untainted(pafb))))));
    },
  );
}

export function mapped<A, B = A>(): <F>(
  F: Functor<F>,
) => PSetter<Kind<F, [A]>, Kind<F, [B]>, A, B> {
  return F => sets(F.map);
}

export function contramapped<A, B = A>(): <F>(
  F: Contravariant<F>,
) => PSetter<Kind<F, [B]>, Kind<F, [A]>, A, B> {
  return F => sets(F.contramap);
}

// -- Consuming Setters

export function modify<S, T, A, B>(
  l: PSetter<S, T, A, B>,
): (f: (a: A) => B) => (s: S) => T {
  return l.runOptic(Settable.Identity, Indexable.Function1);
}

export function imodify<I, S, T, A, B>(
  l: IndexedPSetter<I, S, T, A, B>,
): (f: (a: A, i: I) => B) => (s: S) => T {
  return l.runOptic(Settable.Identity, Indexable.Indexed<I>());
}

export function replace<S, T, A, B>(
  l: PSetter<S, T, A, B>,
): (b: B) => (s: S) => T {
  const m = modify(l);
  return b => m(_ => b);
}

export function ireplace<I, S, T, A, B>(
  l: IndexedPSetter<I, S, T, A, B>,
): (f: (i: I) => B) => (s: S) => T {
  const m = imodify(l);
  return b => m((_, i) => b(i));
}

export function add<S, T>(
  l: PSetter<S, T, number, number>,
): (n: number) => (s: S) => T {
  const m = modify(l);
  return y => m(x => x + y);
}
export function sub<S, T>(
  l: PSetter<S, T, number, number>,
): (n: number) => (s: S) => T {
  const m = modify(l);
  return y => m(x => x - y);
}
export function mul<S, T>(
  l: PSetter<S, T, number, number>,
): (n: number) => (s: S) => T {
  const m = modify(l);
  return y => m(x => x * y);
}
export function div<S, T>(
  l: PSetter<S, T, number, number>,
): (n: number) => (s: S) => T {
  const m = modify(l);
  return y => m(x => x / y);
}

export function and<S, T>(
  l: PSetter<S, T, boolean, boolean>,
): (x: boolean) => (s: S) => T {
  const m = modify(l);
  return y => m(x => x && y);
}
export function or<S, T>(
  l: PSetter<S, T, boolean, boolean>,
): (x: boolean) => (s: S) => T {
  const m = modify(l);
  return y => m(x => x || y);
}

// -- mtl

export function setting<F, S>(
  F: MonadState<F, S>,
): <A, B>(l: PSetter<S, S, A, B>) => (b: B) => Kind<F, [void]> {
  return l => F1.andThen(replace(l), F.modify);
}
export function isetting<F, S>(
  F: MonadState<F, S>,
): <I, A, B>(
  l: IndexedPSetter<I, S, S, A, B>,
) => (f: (i: I) => B) => Kind<F, [void]> {
  return l => f => F.modify(imodify(l)((_, i) => f(i)));
}

export function modifying<F, S>(
  F: MonadState<F, S>,
): <A, B>(l: PSetter<S, S, A, B>) => (f: (a: A) => B) => Kind<F, [void]> {
  return l => F1.andThen(modify(l), F.modify);
}

export function imodifying<F, S>(
  F: MonadState<F, S>,
): <I, A, B>(
  l: IndexedPSetter<I, S, S, A, B>,
) => (f: (a: A, i: I) => B) => Kind<F, [void]> {
  return l => f => F.modify(imodify(l)(f));
}

export function locally<F, R>(
  F: MonadReader<F, R>,
): <A, B>(
  l: PSetter<R, R, A, B>,
) => (f: (a: A) => B) => <X>(fx: Kind<F, [X]>) => Kind<F, [X]> {
  return l => F1.andThen(modify(l), F.local);
}
export function ilocally<F, R>(
  F: MonadReader<F, R>,
): <I, A, B>(
  l: IndexedPSetter<I, R, R, A, B>,
) => (f: (a: A, i: I) => B) => <X>(fx: Kind<F, [X]>) => Kind<F, [X]> {
  return l => f => F.local(imodify(l)(f));
}

export function censoring<F, W>(
  F: MonadWriter<F, W>,
): <A, B>(
  l: PSetter<W, W, A, B>,
) => (f: (a: A) => B) => <X>(fx: Kind<F, [X]>) => Kind<F, [X]> {
  return l => F1.andThen(modify(l), F.censor);
}

// -- Private helpers

const mkSetter = <S, T, A, B>(
  apply: <F>(
    F: Settable<F>,
    P: Function1Indexable,
  ) => (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]>,
): PSetter<S, T, A, B> => new Optic(apply as any) as any;

const mkIxSetter = <I, S, T, A, B>(
  apply: <F, P, RepF, CorepF>(
    F: Settable<F>,
    P: Indexable<P, I, RepF, CorepF>,
  ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => (s: S) => Kind<F, [T]>,
): IndexedPSetter<I, S, T, A, B> => new IndexedOptic(apply as any) as any;

const mkIxPSetter = <S, T, A, B>(
  apply: <F, P, RepF, CorepF>(
    F: Settable<F>,
    P: Conjoined<P, RepF, CorepF>,
  ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => Kind<P, [S, Kind<F, [T]>]>,
): IndexPreservingPSetter<S, T, A, B> =>
  new IndexPreservingOptic(apply as any) as any;
