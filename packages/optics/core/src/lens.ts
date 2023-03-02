// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Functor } from '@fp4ts/cats';
import { F1, Kind } from '@fp4ts/core';
import { Getter, IndexedGetter, IndexPreservingGetter } from './getter';
import {
  IndexedPTraversal,
  IndexPreservingPTraversal,
  PTraversal,
} from './traversal';

import {
  Conjoined,
  Function1Indexable,
  Indexable,
  IndexedOptic,
  IndexPreservingOptic,
  Optic,
} from './internal';

export interface PLens<in S, out T, out A, in B>
  extends Getter<S, A>,
    PTraversal<S, T, A, B> {
  readonly S: (s: S) => void;
  readonly T: () => T;
  readonly A: () => A;
  readonly B: (b: B) => void;

  readonly runOptic: <F>(
    F: Functor<F>,
    P: Function1Indexable,
  ) => (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]>;

  readonly taking: PTraversal<S, T, A, B>['taking'];
  readonly dropping: PTraversal<S, T, A, B>['dropping'];
  readonly orElse: PTraversal<S, T, A, B>['orElse'];
}

export type Lens<S, A> = PLens<S, S, A, A>;

export interface IndexedPLens<out I, in S, out T, out A, in B>
  extends IndexedGetter<I, S, A>,
    IndexedPTraversal<I, S, T, A, B>,
    PLens<S, T, A, B> {
  readonly S: (s: S) => void;
  readonly T: () => T;
  readonly A: () => A;
  readonly B: (b: B) => void;
  readonly I: () => I;

  readonly runOptic: <F, P, RepF, CorepF>(
    F: Functor<F>,
    P: Indexable<P, I, RepF, CorepF>,
  ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => (s: S) => Kind<F, [T]>;

  readonly compose: IndexedOptic<I, S, T, A, B>['compose'];
  readonly taking: IndexedPTraversal<I, S, T, A, B>['taking'];
  readonly dropping: IndexedPTraversal<I, S, T, A, B>['dropping'];
  readonly orElse: IndexedPTraversal<I, S, T, A, B>['orElse'];
}

export type IndexedLens<I, S, A> = IndexedPLens<I, S, S, A, A>;

export interface IndexPreservingPLens<in S, out T, out A, in B>
  extends IndexPreservingGetter<S, A>,
    IndexPreservingPTraversal<S, T, A, B>,
    PLens<S, T, A, B> {
  readonly S: (s: S) => void;
  readonly T: () => T;
  readonly A: () => A;
  readonly B: (b: B) => void;

  readonly runOptic: <F, P>(
    F: Functor<F>,
    P: Conjoined<P, any, any>,
  ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => Kind<P, [S, Kind<F, [T]>]>;

  readonly compose: IndexPreservingOptic<S, T, A, B>['compose'];
  readonly taking: PTraversal<S, T, A, B>['taking'];
  readonly dropping: PTraversal<S, T, A, B>['dropping'];
  readonly orElse: PTraversal<S, T, A, B>['orElse'];
}

export type IndexPreservingLens<S, A> = IndexPreservingPLens<S, S, A, A>;

// -- Constructors

export function lens<S, A>(
  getter: (s: S) => A,
  setter: (s: S) => (a: A) => S,
): Lens<S, A>;
export function lens<S, T, A, B>(
  getter: (s: S) => A,
  setter: (s: S) => (b: B) => T,
): PLens<S, T, A, B>;
export function lens<S, T, A, B>(
  getter: (s: S) => A,
  setter: (s: S) => (b: B) => T,
): PLens<S, T, A, B> {
  return mkLens(
    <F>(F: Functor<F>, P: Function1Indexable) =>
      (afb: (a: A) => Kind<F, [B]>) =>
      (s: S): Kind<F, [T]> =>
        F.map_(afb(getter(s)), setter(s)),
  );
}

export function ilens<I, S, A>(
  getter: (s: S) => [A, I],
  setter: (s: S) => (a: A) => S,
): IndexedLens<I, S, A>;
export function ilens<I, S, T, A, B>(
  getter: (s: S) => [A, I],
  setter: (s: S) => (b: B) => T,
): IndexedPLens<I, S, T, A, B>;
export function ilens<I, S, T, A, B>(
  getter: (s: S) => [A, I],
  setter: (s: S) => (b: B) => T,
): IndexedPLens<I, S, T, A, B> {
  return mkIxLens(
    <F, P, RepF, CorepF>(F: Functor<F>, P: Indexable<P, I, RepF, CorepF>) =>
      (pafb: Kind<P, [A, Kind<F, [B]>]>) =>
      (s: S): Kind<F, [T]> => {
        const ai = getter(s);
        return F.map_(P.indexed(pafb)(ai[0], ai[1]), setter(s));
      },
  );
}

export function iplens<S, A>(
  getter: (s: S) => A,
  setter: (s: S) => (a: A) => S,
): IndexPreservingLens<S, A>;
export function iplens<S, T, A, B>(
  getter: (s: S) => A,
  setter: (s: S) => (b: B) => T,
): IndexPreservingPLens<S, T, A, B>;
export function iplens<S, T, A, B>(
  getter: (s: S) => A,
  setter: (s: S) => (b: B) => T,
): IndexPreservingPLens<S, T, A, B> {
  return mkIxPLens(
    <F, P, RepF, CorepF>(F: Functor<F>, P: Conjoined<P, RepF, CorepF>) =>
      (P as any) === Indexable.Function1
        ? (((afb: (a: A) => Kind<F, [B]>) =>
            (s: S): Kind<F, [T]> =>
              F.map_(afb(getter(s)), setter(s))) as any)
        : (P as any) === Indexable.Indexed<any>()
        ? (((f: (a: A, i: unknown) => Kind<F, [B]>) =>
            (s: S, i: unknown): Kind<F, [T]> =>
              F.map_(f(getter(s), i), setter(s))) as any)
        : (pafb: Kind<P, [A, Kind<F, [B]>]>): Kind<P, [S, Kind<F, [T]>]> =>
            P.cotabulate((cs: Kind<CorepF, [S]>) =>
              F.map_(
                P.cosieve(pafb)(P.C.map_(cs, getter)),
                setter(P.C.extract(cs)),
              ),
            ),
  );
}

export function prop<S, k extends keyof S>(k: k): IndexPreservingLens<S, S[k]> {
  return mkIxPLens(
    <F, P, RepF, CorepF>(F: Functor<F>, P: Conjoined<P, RepF, CorepF>) =>
      (P as any) === Indexable.Function1
        ? (((f: (sk: S[k]) => Kind<F, [S[k]]>) =>
            (s: S): Kind<F, [S]> =>
              F.map_(f(s[k]), sk => ({ ...s, [k]: sk }))) as any)
        : (P as any) === Indexable.Indexed<any>()
        ? (((f: (sk: S[k], i: unknown) => Kind<F, [S[k]]>) =>
            (s: S, i: unknown): Kind<F, [S]> =>
              F.map_(f(s[k], i), sk => ({ ...s, [k]: sk }))) as any)
        : F1.andThen(
            P.first<S>()<S[k], Kind<F, [S[k]]>>,
            P.dimap(
              (s: S): [S[k], S] => [s[k], s],
              ([fsk, s]: [Kind<F, [S[k]]>, S]) =>
                F.map_(fsk, (k: S[k]) => ({ ...s, [k as any]: k } as S)),
            ),
          ),
  );
}
export function pick<S, ks extends readonly [keyof S, ...(keyof S)[]]>(
  ...ks: ks
): IndexPreservingLens<S, Pick<S, ks[number]>> {
  type Sks = Pick<S, ks[number]>;
  return mkIxPLens(
    <F, P, RepF, CorepF>(F: Functor<F>, P: Conjoined<P, RepF, CorepF>) =>
      (P as any) === Indexable.Function1
        ? (((f: (sk: Sks) => Kind<F, [Sks]>) =>
            (s: S): Kind<F, [S]> =>
              F.map_(f(_pick(s, ks)), sk => ({ ...s, ...sk }))) as any)
        : (P as any) === Indexable.Indexed<any>()
        ? (((f: (sk: Sks, i: unknown) => Kind<F, [Sks]>) =>
            (s: S, i: unknown): Kind<F, [S]> =>
              F.map_(f(_pick(s, ks), i), sk => ({ ...s, ...sk }))) as any)
        : F1.andThen(
            P.first<S>()<Sks, Kind<F, [Sks]>>,
            P.dimap(
              (s: S): [Sks, S] => [_pick(s, ks), s],
              ([fsk, s]: [Kind<F, [Sks]>, S]) =>
                F.map_(fsk, (sks: Sks) => ({ ...s, ...sks } as S)),
            ),
          ),
  );
}

export function omit<S, ks extends readonly [keyof S, ...(keyof S)[]]>(
  ...ks: ks
): IndexPreservingLens<S, Omit<S, ks[number]>> {
  type Sks = Omit<S, ks[number]>;
  return mkIxPLens(
    <F, P, RepF, CorepF>(F: Functor<F>, P: Conjoined<P, RepF, CorepF>) =>
      (P as any) === Indexable.Function1
        ? (((f: (sk: Sks) => Kind<F, [Sks]>) =>
            (s: S): Kind<F, [S]> =>
              F.map_(f(_omit(s, ks)), sk => ({ ...s, ...sk }))) as any)
        : (P as any) === Indexable.Indexed<any>()
        ? (((f: (sk: Sks, i: unknown) => Kind<F, [Sks]>) =>
            (s: S, i: unknown): Kind<F, [S]> =>
              F.map_(f(_omit(s, ks), i), sk => ({ ...s, ...sk }))) as any)
        : F1.andThen(
            P.first<S>()<Sks, Kind<F, [Sks]>>,
            P.dimap(
              (s: S): [Sks, S] => [_omit(s, ks), s],
              ([fsk, s]: [Kind<F, [Sks]>, S]) =>
                F.map_(fsk, (sks: Sks) => ({ ...s, ...sks } as S)),
            ),
          ),
  );
}

// -- Private helpers

const mkLens = <S, T, A, B>(
  apply: <F>(
    F: Functor<F>,
    P: Function1Indexable,
  ) => (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]>,
): PLens<S, T, A, B> => new Optic(apply as any) as any;

const mkIxLens = <I, S, T, A, B>(
  apply: <F, P, RepF, CorepF>(
    F: Functor<F>,
    P: Indexable<P, I, RepF, CorepF>,
  ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => (s: S) => Kind<F, [T]>,
): IndexedPLens<I, S, T, A, B> => new IndexedOptic(apply as any) as any;

const mkIxPLens = <S, T, A, B>(
  apply: <F, P, RepF, CorepF>(
    F: Functor<F>,
    P: Conjoined<P, RepF, CorepF>,
  ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => Kind<P, [S, Kind<F, [T]>]>,
): IndexPreservingPLens<S, T, A, B> =>
  new IndexPreservingOptic(apply as any) as any;

function _pick<S, ks extends readonly [keyof S, ...(keyof S)[]]>(
  s: S,
  ks: ks,
): Pick<S, ks[number]> {
  const sks: Partial<Pick<S, ks[number]>> = {};
  for (let i = 0, len = ks.length; i < len; i++) {
    sks[ks[i]] = s[ks[i]];
  }
  return sks as Pick<S, ks[number]>;
}

function _omit<S, ks extends readonly [keyof S, ...(keyof S)[]]>(
  s: S,
  ks: ks,
): Omit<S, ks[number]> {
  const sks: S = { ...s };
  for (let i = 0, len = ks.length; i < len; i++) {
    delete (sks as any)[ks[i] as any];
  }
  return sks as Omit<S, ks[number]>;
}
