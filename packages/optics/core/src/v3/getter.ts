// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Contravariant, Functor, Option, Some } from '@fp4ts/cats';
import { F1, fst, id, Kind, tuple } from '@fp4ts/core';
import { MonadReader, MonadState, MonadWriter } from '@fp4ts/mtl';
import { Fold, IndexedFold, IndexPreservingFold } from './fold';

import {
  Conjoined,
  Function1Indexable,
  Indexable,
  IndexedOptic,
  IndexPreservingOptic,
  mkFoldConstInstance,
  mkGetterConstInstance,
  Optic,
  _firstOption,
} from './internal';
import { Review, unto } from './review';

export interface Getter<in S, out A> extends Fold<S, A> {
  readonly runOptic: <F>(
    F: Contravariant<F> & Functor<F>,
    P: Function1Indexable,
  ) => (f: (a: A) => Kind<F, [never]>) => (s: S) => Kind<F, [unknown]>;
}

export interface IndexedGetter<out I, in S, out A>
  extends IndexedFold<I, S, A>,
    Getter<S, A> {
  readonly runOptic: <F, P, RepF, CorepF>(
    F: Contravariant<F> & Functor<F>,
    P: Indexable<P, I, RepF, CorepF>,
  ) => (pafb: Kind<P, [A, Kind<F, [never]>]>) => (s: S) => Kind<F, [unknown]>;

  readonly compose: IndexedOptic<I, S, unknown, A, never>['compose'];
  readonly taking: IndexedFold<I, S, A>['taking'];
  readonly dropping: IndexedFold<I, S, A>['dropping'];
}

export interface IndexPreservingGetter<in S, out A>
  extends IndexPreservingFold<S, A>,
    Getter<S, A> {
  readonly runOptic: <F, P>(
    F: Contravariant<F> & Functor<F>,
    P: Conjoined<P, any, any>,
  ) => (
    pafb: Kind<P, [A, Kind<F, [never]>]>,
  ) => Kind<P, [S, Kind<F, [unknown]>]>;

  readonly compose: IndexPreservingOptic<S, unknown, A, never>['compose'];
}

// -- Constructors

export function to<S, A>(f: (s: S) => A): IndexPreservingGetter<S, A> {
  return mkIxPGetter((F, P) => P.dimap(f, F.contramap(f)));
}

export function ito<I, S, A>(f: (s: S) => [A, I]): IndexedGetter<I, S, A> {
  return mkIxGetter(
    <F, P>(
      F: Contravariant<F>,
      P: Indexable<P, I>,
    ): ((a: Kind<P, [A, Kind<F, [never]>]>) => (a: S) => Kind<F, [S]>) =>
      F1.compose(
        Indexable.Function1.dimap(f, F.contramap(F1.compose(fst, f))),
        F1.compose(tuple<[a: A, i: I], Kind<F, [never]>>, P.indexed),
      ),
  );
}

// -- Consuming Getters

export function get<S, A>(l: Getter<S, A>): (s: S) => A {
  return gets(l)(id);
}

export function gets<S, A>(
  l: Getter<S, A>,
): <R>(f: (a: A) => R) => (s: S) => R {
  return l.runOptic(mkGetterConstInstance<any>(), Indexable.Function1);
}

export function iget<I, S, A>(l: IndexedGetter<I, S, A>): (s: S) => [A, I] {
  return igets(l)((a, i) => [a, i]);
}

export function igets<I, S, A>(
  l: IndexedGetter<I, S, A>,
): <R>(f: (a: A, i: I) => R) => (s: S) => R {
  return l.runOptic(mkGetterConstInstance<any>(), Indexable.Indexed<I>());
}

// -- Combinators

export function un<S, A>(l: Getter<S, A>): Review<A, S> {
  return unto(get(l));
}

export function pre<S, A>(l: Fold<S, A>): IndexPreservingGetter<S, Option<A>> {
  return mkIxPGetter(
    <F, P, RepF, CorepF>(
      F: Contravariant<F> & Functor<F>,
      P: Conjoined<P, RepF, CorepF>,
    ) =>
      P.dimap(
        l.runOptic(
          mkFoldConstInstance(_firstOption<any>()),
          Indexable.Function1,
        )(Some),
        F1.compose(F.contramap(voidFn), F.map(voidFn)),
      ),
  );
}

export function ipre<I, S, A>(
  l: IndexedFold<I, S, A>,
): IndexPreservingGetter<S, Option<[A, I]>> {
  return mkIxPGetter(
    <F, P, RepF, CorepF>(
      F: Contravariant<F> & Functor<F>,
      P: Conjoined<P, RepF, CorepF>,
    ) =>
      P.dimap(
        l.runOptic(
          mkFoldConstInstance(_firstOption<any>()),
          Indexable.Indexed<I>(),
        )((a, i) => Some([a, i] as [any, I])),
        F1.compose(F.contramap(voidFn), F.map(voidFn)),
      ),
  );
}

// -- mtl

export function view<F, R>(
  F: MonadReader<F, R>,
): <A>(l: Getter<R, A>) => Kind<F, [A]> {
  return F1.andThen(get, F.asks);
}
export function iview<F, R>(
  F: MonadReader<F, R>,
): <I, A>(l: IndexedGetter<I, R, A>) => Kind<F, [[A, I]]> {
  return F1.andThen(iget, F.asks);
}

export function views<F, R>(
  F: MonadReader<F, R>,
): <A>(l: Getter<R, A>) => <B>(f: (a: A) => B) => Kind<F, [B]> {
  return l => f => F.asks(F1.andThen(get(l), f));
}
export function iviews<F, R>(
  F: MonadReader<F, R>,
): <I, A>(
  l: IndexedGetter<I, R, A>,
) => <B>(f: (a: A, i: I) => B) => Kind<F, [B]> {
  return l =>
    F1.andThen(
      l.runOptic(mkGetterConstInstance<any>(), Indexable.Indexed<any>()),
      F.asks,
    );
}

export function use<F, S>(
  F: MonadState<F, S>,
): <A>(l: Getter<S, A>) => Kind<F, [A]> {
  return F1.andThen(get, F.inspect);
}

export function uses<F, S>(
  F: MonadState<F, S>,
): <A>(l: Getter<S, A>) => <B>(f: (a: A) => B) => Kind<F, [B]> {
  return l => f => F.inspect(F1.andThen(get(l), f));
}

export function listen<F, W>(
  F: MonadWriter<F, W>,
): (l: Getter<W, W>) => <A>(fa: Kind<F, [A]>) => Kind<F, [[A, W]]> {
  return l => {
    const g = get(l);
    return fa => F.map_(F.listen(fa), ([a, w]) => [a, g(w)]);
  };
}

export function ilisten<F, W>(
  F: MonadWriter<F, W>,
): <I>(
  l: IndexedGetter<I, W, W>,
) => <A>(fa: Kind<F, [A]>) => Kind<F, [[A, [W, I]]]> {
  return l => {
    const g = iget(l);
    return fa => F.map_(F.listen(fa), ([a, w]) => [a, g(w)]);
  };
}

export function listens<F, W>(
  F: MonadWriter<F, W>,
): (
  l: Getter<W, W>,
) => <A>(fa: Kind<F, [A]>) => <V>(f: (w: W) => V) => Kind<F, [[A, V]]> {
  return l => {
    const g = gets(l);
    return fa => f => F.map_(F.listen(fa), ([a, w]) => [a, g(f)(w)]);
  };
}

export function ilistens<F, W>(
  F: MonadWriter<F, W>,
): <I>(
  l: IndexedGetter<I, W, W>,
) => <A>(fa: Kind<F, [A]>) => <V>(f: (w: W, i: I) => V) => Kind<F, [[A, V]]> {
  return l => {
    const g = igets(l);
    return fa => f => F.map_(F.listen(fa), ([a, w]) => [a, g(f)(w)]);
  };
}

// -- Private helpers

const mkGetter = <S, A>(
  apply: <F>(
    F: Contravariant<F> & Functor<F>,
    P: Function1Indexable,
  ) => (f: (a: A) => Kind<F, [never]>) => (s: S) => Kind<F, [unknown]>,
): Getter<S, A> => new Optic(apply as any) as any;

const mkIxGetter = <I, S, A>(
  apply: <F, P, RepF, CorepF>(
    F: Contravariant<F> & Functor<F>,
    P: Indexable<P, I, RepF, CorepF>,
  ) => (pafb: Kind<P, [A, Kind<F, [never]>]>) => (s: S) => Kind<F, [unknown]>,
): IndexedGetter<I, S, A> => new IndexedOptic(apply as any) as any;

const mkIxPGetter = <S, A>(
  apply: <F, P, RepF, CorepF>(
    F: Contravariant<F> & Functor<F>,
    P: Conjoined<P, RepF, CorepF>,
  ) => (
    pafb: Kind<P, [A, Kind<F, [never]>]>,
  ) => Kind<P, [S, Kind<F, [unknown]>]>,
): IndexPreservingGetter<S, A> => new IndexPreservingOptic(apply as any) as any;

const voidFn = (_: unknown): void => {};
