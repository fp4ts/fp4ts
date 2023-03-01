// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Applicative,
  Backwards,
  Functor,
  Traversable,
  TraversableWithIndex,
} from '@fp4ts/cats';
import { Eval, F1, id, Kind } from '@fp4ts/core';
import { State } from '@fp4ts/mtl';
import { Fold, IndexedFold, IndexPreservingFold } from './fold';
import { IndexedPLens, PLens } from './lens';
import { IndexedPSetter, IndexPreservingPSetter, PSetter } from './setter';

import {
  Conjoined,
  Function1Indexable,
  Indexable,
  IndexedOptic,
  IndexPreservingOptic,
  Optic,
} from './internal';

export interface PTraversal<in S, out T, out A, in B>
  extends Fold<S, A>,
    PSetter<S, T, A, B> {
  readonly S: (s: S) => void;
  readonly T: () => T;
  readonly A: () => A;
  readonly B: (b: B) => void;

  readonly runOptic: <F>(
    F: Applicative<F>,
    P: Function1Indexable,
  ) => (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]>;

  taking(n: number): PTraversal<S, T, A, B>;
  dropping(n: number): PTraversal<S, T, A, B>;
  orElse<T, A>(
    this: PTraversal<S, T, A, B>,
    that: PTraversal<S, T, A, B>,
  ): PTraversal<S, T, A, B>;
}

export type Traversal<S, A> = PTraversal<S, S, A, A>;

export interface IndexedPTraversal<out I, in S, out T, out A, in B>
  extends IndexedFold<I, S, A>,
    IndexedPSetter<I, S, T, A, B>,
    PTraversal<S, T, A, B> {
  readonly S: (s: S) => void;
  readonly T: () => T;
  readonly A: () => A;
  readonly B: (b: B) => void;
  readonly I: () => I;

  readonly runOptic: <F, P, RepF, CorePF>(
    F: Applicative<F>,
    P: Indexable<P, I, RepF, CorePF>,
  ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => (s: S) => Kind<F, [T]>;

  readonly compose: IndexedOptic<I, S, T, A, B>['compose'];
  taking(n: number): IndexedPTraversal<I, S, T, A, B>;
  dropping(n: number): IndexedPTraversal<I, S, T, A, B>;
  readonly orElse: PTraversal<S, T, A, B>['orElse'];
}

export type IndexedTraversal<I, S, A> = IndexedPTraversal<I, S, S, A, A>;

export interface IndexPreservingPTraversal<in S, out T, out A, in B>
  extends IndexPreservingFold<S, A>,
    IndexPreservingPSetter<S, T, A, B>,
    PTraversal<S, T, A, B> {
  readonly S: (s: S) => void;
  readonly T: () => T;
  readonly A: () => A;
  readonly B: (b: B) => void;

  readonly runOptic: <F, P>(
    F: Applicative<F>,
    P: Conjoined<P, any, any>,
  ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => Kind<P, [S, Kind<F, [T]>]>;

  readonly compose: IndexPreservingOptic<S, T, A, B>['compose'];
  readonly taking: PTraversal<S, T, A, B>['taking'];
  readonly dropping: PTraversal<S, T, A, B>['dropping'];
  readonly orElse: PTraversal<S, T, A, B>['orElse'];
}

export type IndexPreservingTraversal<S, A> = IndexPreservingPTraversal<
  S,
  S,
  A,
  A
>;

// -- Constructors

export function traversal<S, A>(
  k: <G>(
    G: Applicative<G>,
  ) => (f: (a: A) => Kind<G, [A]>) => (s: S) => Kind<G, [S]>,
): Traversal<S, A>;
export function traversal<S, T, A, B>(
  k: <G>(
    G: Applicative<G>,
  ) => (f: (a: A) => Kind<G, [B]>) => (s: S) => Kind<G, [T]>,
): PTraversal<S, T, A, B>;
export function traversal<S, T, A, B>(
  k: <G>(
    G: Applicative<G>,
  ) => (f: (a: A) => Kind<G, [B]>) => (s: S) => Kind<G, [T]>,
): PTraversal<S, T, A, B> {
  return mkTraversal(<F>(F: Applicative<F>, P: Function1Indexable) => k(F));
}
export function itraversal<I, S, A>(
  k: <G>(
    G: Applicative<G>,
  ) => (f: (a: A, i: I) => Kind<G, [A]>) => (s: S) => Kind<G, [S]>,
): IndexedTraversal<I, S, A>;
export function itraversal<I, S, T, A, B>(
  k: <G>(
    G: Applicative<G>,
  ) => (f: (a: A, i: I) => Kind<G, [B]>) => (s: S) => Kind<G, [T]>,
): IndexedPTraversal<I, S, T, A, B>;
export function itraversal<I, S, T, A, B>(
  k: <G>(
    G: Applicative<G>,
  ) => (f: (a: A, i: I) => Kind<G, [B]>) => (s: S) => Kind<G, [T]>,
): IndexedPTraversal<I, S, T, A, B> {
  return mkIxTraversal(
    <F, P, RepF, CorepF>(F: Applicative<F>, P: Indexable<P, I, RepF, CorepF>) =>
      // eslint-disable-next-line prettier/prettier
      F1.andThen((P).indexed<A, Kind<F, [B]>>, k(F)),
  );
}

export function traversed<A>(): Traversal<A[], A>;
export function traversed<A, B>(): PTraversal<A[], B[], A, B>;
export function traversed<G>(G: Traversable<G>): {
  <A>(): Traversal<Kind<G, [A]>, A>;
  <A, B>(): PTraversal<Kind<G, [A]>, Kind<G, [B]>, A, B>;
};
export function traversed(G?: any): any {
  return G ? () => _fromTraversable(G) : arrayTraversal;
}

export function itraversed<A>(): IndexedTraversal<number, A[], A>;
export function itraversed<A, B>(): IndexedPTraversal<number, A[], B[], A, B>;
export function itraversed<G, I>(
  G: TraversableWithIndex<G, I>,
): {
  <A>(): IndexedTraversal<I, Kind<G, [A]>, A>;
  <A, B>(): IndexedPTraversal<I, Kind<G, [A]>, Kind<G, [B]>, A, B>;
};
export function itraversed(G?: any): any {
  return G ? () => _fromTraversableWithIndex(G) : arrayIndexedTraversal;
}

function _fromTraversable<G, A, B = A>(
  G: Traversable<G>,
): PTraversal<Kind<G, [A]>, Kind<G, [B]>, A, B> {
  return traversal<Kind<G, [A]>, Kind<G, [B]>, A, B>(G.traverse);
}

function _fromTraversableWithIndex<I, G, A, B = A>(
  G: TraversableWithIndex<G, I>,
): IndexedPTraversal<I, Kind<G, [A]>, Kind<G, [B]>, A, B> {
  return itraversal<I, Kind<G, [A]>, Kind<G, [B]>, A, B>(G.traverseWithIndex);
}

export function repeated<A>(): Traversal<A, A> {
  return mkTraversal(
    <F>(F: Applicative<F>, P: Function1Indexable) =>
      (f: (a: A) => Kind<F, [A]>) =>
      (a: A): Kind<F, [A]> => {
        const efa: Eval<Kind<F, [A]>> = F.map2Eval_(
          f(a),
          Eval.defer(() => efa),
          _snd,
        );
        return efa.value;
      },
  );
}

export function iterated<A>(f: (a: A) => A): Traversal<A, A> {
  return mkTraversal(
    <F>(F: Applicative<F>, P: Function1Indexable) =>
      (g: (a: A) => Kind<F, [A]>) => {
        const go = (a: A): Eval<Kind<F, [A]>> =>
          F.map2Eval_(
            g(a),
            Eval.defer(() => go(f(a))),
            _snd,
          );
        return (a: A): Kind<F, [A]> => go(a).value;
      },
  );
}

// -- Consuming Traversals

export function traverse<S, T, A, B>(
  l: PLens<S, T, A, B>,
): <F>(F: Functor<F>) => (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]>;
export function traverse<S, T, A, B>(
  l: PTraversal<S, T, A, B>,
): <F>(
  F: Applicative<F>,
) => (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]>;
export function traverse<S, T, A, B>(
  l: PTraversal<S, T, A, B>,
): <F>(
  F: Applicative<F>,
) => (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]> {
  return F => l.runOptic(F, Indexable.Function1);
}

export function itraverse<I, S, T, A, B>(
  l: IndexedPLens<I, S, T, A, B>,
): <F>(
  F: Functor<F>,
) => (f: (a: A, i: I) => Kind<F, [B]>) => (s: S) => Kind<F, [T]>;
export function itraverse<I, S, T, A, B>(
  l: IndexedPTraversal<I, S, T, A, B>,
): <F>(
  F: Applicative<F>,
) => (f: (a: A, i: I) => Kind<F, [B]>) => (s: S) => Kind<F, [T]>;
export function itraverse<I, S, T, A, B>(
  l: IndexedPTraversal<I, S, T, A, B>,
): <F>(
  F: Applicative<F>,
) => (f: (a: A, i: I) => Kind<F, [B]>) => (s: S) => Kind<F, [T]> {
  return F => l.runOptic(F, Indexable.Indexed<I>());
}

export function sequence<F, S, T, B>(
  l: PLens<S, T, Kind<F, [B]>, B>,
): (F: Functor<F>) => (s: S) => Kind<F, [T]>;
export function sequence<F, S, T, B>(
  l: PTraversal<S, T, Kind<F, [B]>, B>,
): (F: Applicative<F>) => (s: S) => Kind<F, [T]>;
export function sequence<F, S, T, B>(
  l: PTraversal<S, T, Kind<F, [B]>, B>,
): (F: Applicative<F>) => (s: S) => Kind<F, [T]> {
  return F => l.runOptic(F, Indexable.Function1)(id);
}

export function mapAccumL<S, T, A, B>(
  l: PTraversal<S, T, A, B>,
): <Acc>(z: Acc, f: (acc: Acc, a: A) => [B, Acc]) => (s: S) => [T, Acc] {
  const g = l.runOptic(State.Monad<any>(), Indexable.Function1);
  return <Acc>(z: Acc, f: (acc: Acc, a: A) => [B, Acc]) => {
    const h = g(a => State.state((acc: Acc) => f(acc, a)));
    return (s: S) => h(s).runState(z);
  };
}
export function imapAccumL<I, S, T, A, B>(
  l: IndexedPTraversal<I, S, T, A, B>,
): <Acc>(z: Acc, f: (acc: Acc, a: A, i: I) => [B, Acc]) => (s: S) => [T, Acc] {
  const g = l.runOptic(State.Monad<any>(), Indexable.Indexed<I>());
  return <Acc>(z: Acc, f: (acc: Acc, a: A, i: I) => [B, Acc]) => {
    const h = g((a, i) => State.state((acc: Acc) => f(acc, a, i)));
    return (s: S) => h(s).runState(z);
  };
}

export function mapAccumR<S, T, A, B>(
  l: PTraversal<S, T, A, B>,
): <Acc>(z: Acc, f: (acc: Acc, a: A) => [B, Acc]) => (s: S) => [T, Acc] {
  const g = l.runOptic(
    Backwards.Monad(State.Monad<any>()),
    Indexable.Function1,
  );
  return <Acc>(z: Acc, f: (acc: Acc, a: A) => [B, Acc]) => {
    const h = g(a => State.state((acc: Acc) => f(acc, a)));
    return (s: S) => h(s).runState(z);
  };
}
export function imapAccumR<I, S, T, A, B>(
  l: IndexedPTraversal<I, S, T, A, B>,
): <Acc>(z: Acc, f: (acc: Acc, a: A) => [B, Acc]) => (s: S) => [T, Acc] {
  const g = l.runOptic(
    Backwards.Monad(State.Monad<any>()),
    Indexable.Function1,
  );
  return <Acc>(z: Acc, f: (acc: Acc, a: A) => [B, Acc]) => {
    const h = g(a => State.state((acc: Acc) => f(acc, a)));
    return (s: S) => h(s).runState(z);
  };
}

// -- Private helpers

const mkTraversal = <S, T, A, B>(
  apply: <F>(
    F: Applicative<F>,
    P: Function1Indexable,
  ) => (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]>,
): PTraversal<S, T, A, B> => new Optic(apply as any) as any;

const mkIxTraversal = <I, S, T, A, B>(
  apply: <F, P, RepF, CorepF>(
    F: Applicative<F>,
    P: Indexable<P, I, RepF, CorepF>,
  ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => (s: S) => Kind<F, [T]>,
): IndexedPTraversal<I, S, T, A, B> => new IndexedOptic(apply as any) as any;

const mkIxPTraversal = <S, T, A, B>(
  apply: <F, P, RepF, CorepF>(
    F: Applicative<F>,
    P: Conjoined<P, RepF, CorepF>,
  ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => Kind<P, [S, Kind<F, [T]>]>,
): IndexPreservingPTraversal<S, T, A, B> =>
  new IndexPreservingOptic(apply as any) as any;

const arrayTraversal = _fromTraversable(Traversable.Array);
const arrayIndexedTraversal = _fromTraversableWithIndex(
  TraversableWithIndex.Array,
);

const _snd = <A, B>(a: A, b: B): B => b;
