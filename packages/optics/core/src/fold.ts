// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Applicative,
  CommutativeMonoid,
  Contravariant,
  Eq,
  Foldable,
  FoldableWithIndex,
  Function1F,
  Functor,
  LazyList,
  LazyListStep,
  Monoid,
  None,
  Option,
  Some,
} from '@fp4ts/cats';
import { Corepresentable } from '@fp4ts/cats-profunctor';
import { Eval, F1, id, Kind, unsafeCoerce } from '@fp4ts/core';
import { MonadReader, MonadState, State } from '@fp4ts/mtl';

import { IndexedPTraversal, IndexedTraversal, PTraversal } from './traversal';
import {
  _firstOption,
  _lastOption,
  Indexable,
  IndexedOptic,
  Optic,
  Function1Indexable,
  IndexPreservingOptic,
  Conjoined,
  mkFoldConstInstance,
  BazaarT,
  mkIndexingInstance,
  Indexing,
} from './internal';

export interface Fold<in S, out A> extends Optic<S, unknown, A, never> {
  readonly runOptic: <F>(
    F: Contravariant<F> & Applicative<F>,
    P: Function1Indexable,
  ) => (f: (a: A) => Kind<F, [never]>) => (s: S) => Kind<F, [unknown]>;

  taking(n: number): Fold<S, A>;
  dropping(n: number): Fold<S, A>;
  orElse<A>(this: Fold<S, A>, that: Fold<S, A>): Fold<S, A>;
}

export interface IndexedFold<out I, in S, out A>
  extends IndexedOptic<I, S, unknown, A, never>,
    Fold<S, A> {
  readonly runOptic: <F, P, RepF, CorepF>(
    F: Contravariant<F> & Applicative<F>,
    P: Indexable<P, I, RepF, CorepF>,
  ) => (pafb: Kind<P, [A, Kind<F, [never]>]>) => (s: S) => Kind<F, [unknown]>;

  readonly compose: IndexedOptic<I, S, unknown, A, never>['compose'];

  taking(n: number): IndexedFold<I, S, A>;
  dropping(n: number): IndexedFold<I, S, A>;
}

export interface IndexPreservingFold<in S, out A>
  extends Fold<S, A>,
    IndexPreservingOptic<S, unknown, A, never> {
  readonly runOptic: <F, P>(
    F: Contravariant<F> & Applicative<F>,
    P: Conjoined<P, any, any>,
  ) => (
    pafb: Kind<P, [A, Kind<F, [never]>]>,
  ) => Kind<P, [S, Kind<F, [unknown]>]>;

  readonly compose: IndexPreservingOptic<S, unknown, A, never>['compose'];
}

// -- Constructors

export function folded<A>(): Fold<A[], A>;
export function folded<G>(G: Foldable<G>): <A>() => Fold<Kind<G, [A]>, A>;
export function folded(G?: any): any {
  return G ? () => _folded(G) : _folded(Foldable.Array);
}
function _folded<G, A>(G: Foldable<G>): Fold<Kind<G, [A]>, A> {
  return mkFold(
    <F>(
      F: Contravariant<F> & Applicative<F>,
      P: Indexable<Function1F, unknown>,
    ) => {
      const traverseA = F.traverseA(G);
      const voided = phantom(F);
      return (f: (a: A) => Kind<F, [never]>) =>
        F1.andThen(traverseA(f), voided);
    },
  );
}

export function ifolded<A>(): IndexedFold<number, A[], A>;
export function ifolded<G, I>(
  G: FoldableWithIndex<G, I>,
): <A>() => IndexedFold<I, Kind<G, [A]>, A>;
export function ifolded(G?: any): any {
  return G ? () => _ifolded(G) : _ifolded(FoldableWithIndex.Array);
}
function _ifolded<G, I, A>(
  G: FoldableWithIndex<G, I>,
): IndexedFold<I, Kind<G, [A]>, A> {
  return mkIxFold(
    <F, P, RepF, CorepF>(
      F: Contravariant<F> & Applicative<F>,
      P: Indexable<P, I, RepF, CorepF>,
    ) => {
      const traverseA = F.traverseWithIndexA(G);
      const voided = phantom(F);
      return (f: Kind<P, [A, Kind<F, [never]>]>) =>
        F1.andThen(traverseA(P.indexed(f)), voided);
    },
  );
}

export function replicated<A>(n: number): Fold<A, A> {
  return mkFold(
    <F>(F: Contravariant<F> & Applicative<F>, P: Function1Indexable) => {
      const voided = phantom(F);
      return (f: (a: A) => Kind<F, [never]>) =>
        (a: A): Kind<F, [unknown]> => {
          const go = (n: number): Eval<Kind<F, [never]>> =>
            n <= 0
              ? Eval.later(() => voided(F.unit))
              : F.map2Eval_(
                  f(a),
                  Eval.defer(() => go(n - 1)),
                  _snd,
                );
          return go(n).value;
        };
    },
  );
}

// -- Consuming Folds

export function foldMap<S, A>(
  l: Fold<S, A>,
): <M>(M: Monoid<M>) => (f: (a: A) => M) => (s: S) => M {
  return <M>(M: Monoid<M>) =>
    l.runOptic(mkFoldConstInstance(M), Indexable.Function1);
}

export function ifoldMap<I, S, A>(
  l: IndexedFold<I, S, A>,
): <M>(M: Monoid<M>) => (f: (a: A, i: I) => M) => (s: S) => M {
  return <M>(M: Monoid<M>) =>
    l.runOptic(mkFoldConstInstance(M), Indexable.Indexed<I>());
}

export function fold<S, A>(l: Fold<S, A>): (M: Monoid<A>) => (s: S) => A {
  const fm = foldMap(l);
  return M => fm(M)(id);
}

export function foldMapLeft<S, A>(
  l: Fold<S, A>,
): <M>(M: Monoid<M>) => (f: (a: A) => M) => (s: S) => M {
  const fl = foldLeft(l);
  return <M>(M: Monoid<M>) =>
    (f: (a: A) => M) =>
      fl(M.empty, (b, a) => M.combine_(b, f(a)));
}

export function ifoldMapLeft<I, S, A>(
  l: IndexedFold<I, S, A>,
): <M>(M: Monoid<M>) => (f: (a: A, i: I) => M) => (s: S) => M {
  const fl = ifoldLeft(l);
  return <M>(M: Monoid<M>) =>
    (f: (a: A, i: I) => M) =>
      fl(M.empty, (b, a, i) => M.combine_(b, f(a, i)));
}

export function foldRight<S, A>(
  l: Fold<S, A>,
): <B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>) => (s: S) => Eval<B> {
  const fm = foldMap(l)(Monoid.EndoEval<any>());
  return <B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>) => {
    const go = fm(a => (eb: Eval<B>) => f(a, eb));
    return (s: S): Eval<B> => go(s)(ez);
  };
}

export function ifoldRight<I, S, A>(
  l: IndexedFold<I, S, A>,
): <B>(
  ez: Eval<B>,
  f: (a: A, eb: Eval<B>, i: I) => Eval<B>,
) => (s: S) => Eval<B> {
  const fm = ifoldMap(l)(Monoid.EndoEval<any>());
  return <B>(ez: Eval<B>, f: (a: A, eb: Eval<B>, i: I) => Eval<B>) => {
    const go = fm((a, i) => (eb: Eval<B>) => f(a, eb, i));
    return (s: S): Eval<B> => go(s)(ez);
  };
}

export function foldRight_<S, A>(
  l: Fold<S, A>,
): <B>(z: B, f: (a: A, b: B) => B) => (s: S) => B {
  const fm = foldMap(l)(Monoid.Endo<any>());
  return <B>(z: B, f: (a: A, b: B) => B) => {
    const go = fm(a => (b: B) => f(a, b));
    return (s: S): B => go(s)(z);
  };
}

export function ifoldRight_<I, S, A>(
  l: IndexedFold<I, S, A>,
): <B>(z: B, f: (a: A, b: B, i: I) => B) => (s: S) => B {
  const fm = ifoldMap(l)(Monoid.Endo<any>());
  return <B>(z: B, f: (a: A, b: B, i: I) => B) => {
    const go = fm((a, i) => (b: B) => f(a, b, i));
    return (s: S): B => go(s)(z);
  };
}

export function foldLeft<S, A>(
  l: Fold<S, A>,
): <B>(z: B, f: (b: B, a: A) => B) => (s: S) => B {
  const fm = foldMap(l)(CommutativeMonoid.void);
  return <B>(z: B, f: (b: B, a: A) => B) =>
    (s: S) => {
      let acc = z;
      fm(a => {
        acc = f(acc, a);
      })(s);
      return acc;
    };
}

export function ifoldLeft<I, S, A>(
  l: IndexedFold<I, S, A>,
): <B>(z: B, f: (b: B, a: A, i: I) => B) => (s: S) => B {
  const fm = ifoldMap(l)(CommutativeMonoid.void);
  return <B>(z: B, f: (b: B, a: A, i: I) => B) =>
    (s: S) => {
      let acc = z;
      fm((a, i) => {
        acc = f(acc, a, i);
      })(s);
      return acc;
    };
}

export function isEmpty<S, A>(l: Fold<S, A>): (s: S) => boolean {
  return foldMap(l)(Monoid.conjunction)(_ => false);
}

export function nonEmpty<S, A>(l: Fold<S, A>): (s: S) => boolean {
  return foldMap(l)(Monoid.disjunction)(_ => true);
}

export function headOption<S, A>(l: Fold<S, A>): (s: S) => Option<A> {
  return foldMap(l)(_firstOption<A>())(Some);
}
export function iheadOption<I, S, A>(
  l: IndexedFold<I, S, A>,
): (s: S) => Option<[A, I]> {
  return ifoldMap(l)(_firstOption<[A, I]>())((a, i) => Some([a, i]));
}
export function lastOption<S, A>(l: Fold<S, A>): (s: S) => Option<A> {
  return foldMap(l)(_lastOption<A>())(Some);
}

export function find<S, A>(
  l: Fold<S, A>,
): (p: (a: A) => boolean) => (s: S) => Option<A> {
  const fm = foldMap(l)(_firstOption<A>());
  return p => fm(x => (p(x) ? Some(x) : None));
}
export function ifind<I, S, A>(
  l: IndexedFold<I, S, A>,
): (p: (a: A, i: I) => boolean) => (s: S) => Option<A> {
  const fm = ifoldMap(l)(_firstOption<A>());
  return p => fm((x, i) => (p(x, i) ? Some(x) : None));
}

export function lookup<S, K, V>(
  l: Fold<S, [K, V]>,
): (k: K, K?: Eq<K>) => (s: S) => Option<V> {
  const fm = foldMap(l)(_firstOption<any>());
  return (k, K = Eq.fromUniversalEquals()) =>
    fm(([k1, v]) => (K.equals(k, k1) ? Some(v) : None));
}

export function any<S, A>(
  l: Fold<S, A>,
): (p: (a: A) => boolean) => (s: S) => boolean {
  return foldMap(l)(Monoid.disjunction);
}
export function iany<I, S, A>(
  l: IndexedFold<I, S, A>,
): (p: (a: A, i: I) => boolean) => (s: S) => boolean {
  return ifoldMap(l)(Monoid.disjunction);
}

export function all<S, A>(
  l: Fold<S, A>,
): (p: (a: A) => boolean) => (s: S) => boolean {
  return foldMap(l)(Monoid.conjunction);
}
export function iall<I, S, A>(
  l: IndexedFold<I, S, A>,
): (p: (a: A, i: I) => boolean) => (s: S) => boolean {
  return ifoldMap(l)(Monoid.conjunction);
}

export function count<S, A>(
  l: Fold<S, A>,
): (p: (a: A) => boolean) => (s: S) => number {
  const fl = foldLeft(l);
  return p => fl(0, (n, x) => (p(x) ? n + 1 : n));
}
export function icount<I, S, A>(
  l: IndexedFold<I, S, A>,
): (p: (a: A, i: I) => boolean) => (s: S) => number {
  const fl = ifoldLeft(l);
  return p => fl(0, (n, x, i) => (p(x, i) ? n + 1 : n));
}

export function size<S, A>(l: Fold<S, A>): (s: S) => number {
  return foldLeft(l)(0, (n, _) => n + 1);
}

export function forEach<S, A>(
  l: Fold<S, A>,
): (f: (a: A) => void) => (s: S) => void {
  return foldMap(l)(CommutativeMonoid.void);
}

export function toArray<S, A>(l: Fold<S, A>): (s: S) => A[] {
  return foldLeft(l)([] as A[], (xs, x) => (xs.push(x), xs));
}

export function toLazyList<S, A>(l: Fold<S, A>): (s: S) => LazyList<A> {
  const fr = foldRight(l);
  return (s: S) =>
    LazyList.fromStepEval(
      fr(Eval.now(LazyList.NilStep) as Eval<LazyListStep<A>>, (head, tail) =>
        Eval.now(LazyList.consStep(head, tail)),
      )(s),
    );
}

export function sum<S>(l: Fold<S, number>): (s: S) => number {
  return foldMap(l)(Monoid.addition)(id);
}

export function product<S>(l: Fold<S, number>): (s: S) => number {
  return foldMap(l)(Monoid.product)(id);
}

// -- Combinators

export function taking<I, S, T, A>(
  l: IndexedPTraversal<I, S, T, A, A>,
): (n: number) => IndexedPTraversal<I, S, T, A, A>;
export function taking<S, T, A>(
  l: PTraversal<S, T, A, A>,
): (n: number) => PTraversal<S, T, A, A>;
export function taking<I, S, A>(
  l: IndexedFold<I, S, A>,
): (n: number) => IndexedFold<I, S, A>;
export function taking<S, A>(l: Fold<S, A>): (n: number) => Fold<S, A>;
export function taking<S, A>(l: Fold<S, A>): (n: number) => Fold<S, A> {
  return l.constructor === IndexedOptic
    ? n => _itaking(n, l as any)
    : n => _taking(n, l as any);
}

function _taking<S, A>(n: number, l: Fold<S, A>): Fold<S, A> {
  return mkFold(
    <F>(F: Applicative<F> & Contravariant<F>, P: Function1Indexable) => {
      const sb = l.runOptic(
        {
          ...BazaarT.Applicative<Function1F, F, A, never>(),
          ...BazaarT.Contravariant<Function1F, F, A, never>(F),
        },
        P,
      )(
        (a: A) =>
          <G>(G: Applicative<G>) =>
          <G>(pafb: (a: A) => Kind<G, [never]>) =>
            pafb(a),
      );

      return (f: (a: A) => Kind<F, [A]>) => (s: S) => {
        const b = sb(s);
        return F.map_(ins(b).take(n).traverse(F)(f), outs(b));
      };
    },
  );
}

function _itaking<I, S, A>(
  n: number,
  l: IndexedFold<I, S, A>,
): IndexedFold<I, S, A> {
  return mkIxFold(
    <F, P, RepF, CorepF>(
      F: Applicative<F> & Contravariant<F>,
      P: Indexable<P, I, RepF, CorepF>,
    ) => {
      const sb = l.runOptic(
        {
          ...BazaarT.Applicative<P, F, A, never>(),
          ...BazaarT.Contravariant<P, F, A, never>(F),
        },
        P,
      )(
        P.cotabulate(
          ca =>
            <G>(G: Applicative<G>) =>
            (paga: Kind<P, [A, Kind<G, [never]>]>) =>
              P.cosieve(paga)(ca),
        ),
      );

      return (pafa: Kind<P, [A, Kind<F, [A]>]>) => (s: S) => {
        const b = sb(s);
        return F.map_(
          pins(P, b).take(n).traverse(F)(P.cosieve(pafa)),
          pouts(P, b),
        );
      };
    },
  );
}

export function dropping<I, S, T, A>(
  l: IndexedPTraversal<I, S, T, A, A>,
): (n: number) => IndexedPTraversal<I, S, T, A, A>;
export function dropping<S, T, A>(
  l: PTraversal<S, T, A, A>,
): (n: number) => PTraversal<S, T, A, A>;
export function dropping<I, S, A>(
  l: IndexedFold<I, S, A>,
): (n: number) => IndexedFold<I, S, A>;
export function dropping<S, A>(l: Fold<S, A>): (n: number) => Fold<S, A>;
export function dropping<S, A>(l: Fold<S, A>): (n: number) => Fold<S, A> {
  return l.constructor === IndexedOptic
    ? n => _idropping(n, l as any)
    : n => _dropping(n, l as any);
}

function _dropping<S, T, A>(
  n: number,
  l: PTraversal<S, T, A, A>,
): PTraversal<S, T, A, A>;
function _dropping<S, A>(n: number, l: Fold<S, A>): Fold<S, A>;
function _dropping<S, A>(n: number, l: Fold<S, A>): Fold<S, A> {
  return mkFold(
    <F>(F: Applicative<F> & Contravariant<F>, P: Function1Indexable) => {
      const voided = phantom(F);
      const k = l.runOptic(mkIndexingInstance(F), P);
      return (f: (a: A) => Kind<F, [never]>) => {
        const faifb =
          (a: A): Indexing<F, never> =>
          i =>
            i.map(i => [i < n ? voided(F.pure(a)) : f(a), Eval.now(i + 1)]);
        const g = k(faifb);
        return (s: S): Kind<F, [unknown]> => g(s)(Eval.zero).value[0];
      };
    },
  );
}

function _idropping<I, S, T, A>(
  n: number,
  l: IndexedPTraversal<I, S, T, A, A>,
): IndexedPTraversal<I, S, T, A, A>;
function _idropping<I, S, A>(
  n: number,
  l: IndexedFold<I, S, A>,
): IndexedFold<I, S, A>;
function _idropping<I, S, A>(
  n: number,
  l: IndexedFold<I, S, A>,
): IndexedFold<I, S, A> {
  return mkIxFold(
    <F, P, RepF, CorepF>(
      F: Applicative<F> & Contravariant<F>,
      P: Indexable<P, I, RepF, CorepF>,
    ) => {
      const voided = phantom(F);
      const k = l.runOptic(mkIndexingInstance(F), P);
      return (pafb: Kind<P, [A, Kind<F, [never]>]>) => {
        const cafb = P.cosieve(pafb);
        const faifb = P.cotabulate(
          (ca: Kind<CorepF, [A]>): Indexing<F, never> =>
            i =>
              i.map(i => [
                i < n ? voided(F.pure(P.C.extract(ca))) : cafb(ca),
                Eval.now(i + 1),
              ]),
        );
        const g = k(faifb);
        return (s: S): Kind<F, [unknown]> => g(s)(Eval.zero).value[0];
      };
    },
  );
}

export function orElse<S, T, A, B>(
  l: PTraversal<S, T, A, B>,
  r: PTraversal<S, T, A, B>,
): PTraversal<S, T, A, B>;
export function orElse<S, A>(l: Fold<S, A>, r: Fold<S, A>): Fold<S, A>;
export function orElse<S, A>(l: Fold<S, A>, r: Fold<S, A>): Fold<S, A> {
  return mkFold(
    <F>(F: Contravariant<F> & Applicative<F>, P: Function1Indexable) => {
      const sb = l.runOptic(
        {
          ...BazaarT.Applicative<Function1F, F, A, never>(),
          ...BazaarT.Contravariant<Function1F, F, A, never>(F),
        },
        P,
      )(
        (a: A) =>
          <G>(G: Applicative<G>) =>
          <G>(pafb: (a: A) => Kind<G, [never]>) =>
            pafb(a),
      );

      return (f: (a: A) => Kind<F, [never]>) =>
        (s: S): Kind<F, [unknown]> => {
          const b = sb(s);
          return ins(b).isEmpty ? r.runOptic(F, P)(f)(s) : b(F)(f);
        };
    },
  );
}

export function ifiltered<I, S, A>(
  l: IndexedTraversal<I, S, A>,
): {
  <B extends A>(p: (a: A, i: I) => a is B): IndexedTraversal<I, S, B>;
  (p: (a: A, i: I) => boolean): IndexedTraversal<I, S, A>;
};
export function ifiltered<I, S, A>(
  l: IndexedFold<I, S, A>,
): {
  <B extends A>(p: (a: A, i: I) => a is B): IndexedFold<I, S, B>;
  (p: (a: A, i: I) => boolean): IndexedFold<I, S, A>;
};
export function ifiltered<I, S, A>(
  l: IndexedFold<I, S, A>,
): (p: (a: A, i: I) => boolean) => IndexedFold<I, S, A> {
  return p => _ifiltered(p, l);
}

function _ifiltered<I, S, A>(
  p: (a: A, i: I) => boolean,
  l: IndexedFold<I, S, A>,
): IndexedFold<I, S, A> {
  return mkIxFold(
    <F, P, RepF, CorepF>(
      F: Applicative<F> & Contravariant<F>,
      P: Indexable<P, I, RepF, CorepF>,
    ) => {
      const g = l.runOptic(F, Indexable.Indexed<I>());
      return (pafb: Kind<P, [A, Kind<F, [never]>]>) => {
        const aifb = P.indexed(pafb);
        return g((a, i) => (p(a, i) ? aifb(a, i) : unsafeCoerce(F.pure(a))));
      };
    },
  );
}

// -- mtl

export function preview<F, R>(
  F: MonadReader<F, R>,
): <A>(l: Fold<R, A>) => Kind<F, [Option<A>]> {
  return F1.andThen(headOption, F.asks);
}

export function previews<F, R>(
  F: MonadReader<F, R>,
): <A>(l: Fold<R, A>) => <B>(f: (a: A) => B) => Kind<F, [Option<B>]> {
  return l => f => F.asks(F1.andThen(headOption(l), b => b.map(f)));
}

export function preuse<F, S>(
  F: MonadState<F, S>,
): <A>(l: Fold<S, A>) => Kind<F, [Option<A>]> {
  return F1.andThen(headOption, F.inspect);
}

export function preuses<F, S>(
  F: MonadState<F, S>,
): <A>(l: Fold<S, A>) => <B>(f: (a: A) => B) => Kind<F, [Option<B>]> {
  return l => f => F.inspect(F1.andThen(headOption(l), b => b.map(f)));
}

// -- Private helpers

const mkFold = <S, A>(
  apply: <F>(
    F: Contravariant<F> & Applicative<F>,
    P: Function1Indexable,
  ) => (f: (a: A) => Kind<F, [never]>) => (s: S) => Kind<F, [unknown]>,
): Fold<S, A> => new Optic(apply as any) as any;

const mkIxFold = <I, S, A>(
  apply: <F, P, RepF, CorepF>(
    F: Contravariant<F> & Applicative<F>,
    P: Indexable<P, I, RepF, CorepF>,
  ) => (pafb: Kind<P, [A, Kind<F, [never]>]>) => (s: S) => Kind<F, [unknown]>,
): IndexedFold<I, S, A> => new IndexedOptic(apply as any) as any;

const mkIxPFold = <S, A>(
  apply: <F, P, RepF, CorepF>(
    F: Contravariant<F> & Applicative<F>,
    P: Conjoined<P, RepF, CorepF>,
  ) => (
    pafb: Kind<P, [A, Kind<F, [never]>]>,
  ) => Kind<P, [S, Kind<F, [unknown]>]>,
): IndexPreservingFold<S, A> => new IndexPreservingOptic(apply as any) as any;

const ins = <F, A, T>(b: BazaarT<Function1F, F, A, A, T>): LazyList<A> =>
  LazyList.fromStepEval(
    b(mkFoldConstInstance(Monoid.EndoEval<LazyListStep<A>>()))(
      a => exs => Eval.now(LazyList.consStep(a, exs)),
    )(Eval.now(LazyList.NilStep)),
  );

const outs =
  <F, A, T>(b: BazaarT<Function1F, F, A, A, T>) =>
  (xs: LazyList<A>): T =>
    b(State.Monad<LazyList<A>>())(
      F1.andThen(unconsWithDefault, State.state),
    ).runStateA(xs);

const pins = <P, CorepF, F, A, T>(
  P: Corepresentable<P, CorepF>,
  b: BazaarT<P, F, A, A, T>,
): LazyList<Kind<CorepF, [A]>> =>
  LazyList.fromStepEval(
    b(mkFoldConstInstance(Monoid.EndoEval<LazyListStep<Kind<CorepF, [A]>>>()))(
      P.cotabulate(a => exs => Eval.now(LazyList.consStep(a, exs))),
    )(Eval.now(LazyList.NilStep)),
  );

const pouts =
  <F, P, RepF, CorepF, A, T>(
    P: Conjoined<P, RepF, CorepF>,
    b: BazaarT<P, F, A, A, T>,
  ) =>
  (xs: LazyList<A>): T =>
    b(State.Monad<LazyList<A>>())(
      P.lift(F1.andThen(unconsWithDefault, State.state)),
    ).runStateA(xs);

const unconsWithDefault =
  <A>(a: A) =>
  (xs: LazyList<A>): [A, LazyList<A>] => {
    const uncons = xs.uncons;
    return uncons.isEmpty ? [a, LazyList.empty] : uncons.get;
  };

const phantom = <F>(
  F: Functor<F> & Contravariant<F>,
): (<A, B>(fa: Kind<F, [A]>) => Kind<F, [B]>) => unsafeCoerce;

// -- Syntax

(Optic.prototype as any).taking = function <S, A>(this: Fold<S, A>, n: number) {
  return _taking(n, this);
};
(IndexedOptic.prototype as any).taking = function <I, S, A>(
  this: IndexedFold<I, S, A>,
  n: number,
) {
  return _itaking(n, this);
};
(Optic.prototype as any).dropping = function <S, A>(
  this: Fold<S, A>,
  n: number,
) {
  return _dropping(n, this);
};
(IndexedOptic.prototype as any).dropping = function <I, S, A>(
  this: IndexedFold<I, S, A>,
  n: number,
) {
  return _idropping(n, this);
};

(Optic.prototype as any).orElse = function <S, A>(
  this: Fold<S, A>,
  that: Fold<S, A>,
) {
  return orElse(this, that);
};

const _snd = <A, B>(a: A, b: B): B => b;
