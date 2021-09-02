import { id, pipe } from '../../../fp/core';
import { Kind } from '../../../fp/hkt';
import { Monoid } from '../../monoid';
import { Applicative } from '../../applicative';
import { MonoidK } from '../../monoid-k';
import { Option, None, Some } from '../option';

import { List, view } from './algebra';
import { cons, empty, fromArray, pure } from './constructors';
import { Eq } from '../../eq';

const throwError = (e: Error) => {
  throw e;
};

export const head = <A>(xs: List<A>): A =>
  fold_(
    xs,
    () => throwError(new Error('Nil.head')),
    h => h,
  );

export const tail = <A>(xs: List<A>): List<A> =>
  fold_(
    xs,
    () => empty,
    (_, t) => t,
  );

export const uncons = <A>(xs: List<A>): Option<[A, List<A>]> =>
  fold_(
    xs,
    () => None,
    (h, t) => Some([h, t]),
  );

export const isEmpty = <A>(xs: List<A>): boolean =>
  fold_(
    xs,
    () => true,
    () => false,
  );

export const nonEmpty = <A>(xs: List<A>): boolean => !isEmpty(xs);

export const size = <A>(xs: List<A>): number => foldLeft_(xs, 0, n => n + 1);

export const toArray = <A>(xs: List<A>): A[] => {
  const results: A[] = [];
  while (nonEmpty(xs)) {
    results.push(head(xs));
    xs = tail(xs);
  }
  return results;
};

export const equals: <A2>(
  E: Eq<A2>,
) => (ys: List<A2>) => <A extends A2>(xs: List<A>) => boolean = E => ys => xs =>
  equals_(E, xs, ys);

export const notEquals: <A2>(
  E: Eq<A2>,
) => (ys: List<A2>) => <A extends A2>(xs: List<A>) => boolean = E => ys => xs =>
  notEquals_(E, xs, ys);

export const reverse = <A>(xs: List<A>): List<A> => {
  let result: List<A> = empty;
  while (nonEmpty(xs)) {
    result = cons(head(xs), result);
    xs = tail(xs);
  }
  return result;
};

export const prepend =
  <B>(x: B) =>
  <A extends B>(xs: List<A>): List<B> =>
    prepend_(xs, x);

export const concat =
  <B>(ys: List<B>) =>
  <A extends B>(xs: List<A>): List<B> =>
    concat_(xs, ys);

export const elem: (idx: number) => <A>(xs: List<A>) => A = idx => xs =>
  elem_(xs, idx);

export const all: <A>(p: (a: A) => boolean) => (xs: List<A>) => boolean =
  p => xs =>
    all_(xs, p);

export const any: <A>(p: (a: A) => boolean) => (xs: List<A>) => boolean =
  p => xs =>
    any_(xs, p);

export const count: <A>(p: (a: A) => boolean) => (xs: List<A>) => number =
  p => xs =>
    count_(xs, p);

export const take: (n: number) => <A>(xs: List<A>) => List<A> = n => xs =>
  take_(xs, n);

export const drop: (n: number) => <A>(xs: List<A>) => List<A> = n => xs =>
  drop_(xs, n);

export const slice: (
  from: number,
  until: number,
) => <A>(xs: List<A>) => List<A> = (from, until) => xs =>
  slice_(xs, from, until);

export const filter: <A>(p: (a: A) => boolean) => (xs: List<A>) => List<A> =
  p => xs =>
    filter_(xs, p);

export const map: <A, B>(f: (a: A) => B) => (xs: List<A>) => List<B> =
  f => xs =>
    map_(xs, f);

export const tap: <A>(f: (a: A) => unknown) => (xs: List<A>) => List<A> =
  f => xs =>
    tap_(xs, f);

export const flatMap: <A, B>(f: (a: A) => List<B>) => (xs: List<A>) => List<B> =
  f => xs => flatMap_(xs, f);

export const flatten: <A>(xs: List<List<A>>) => List<A> = flatMap(id);

export const fold: <A, B>(
  onNil: () => B,
  onCons: (head: A, tail: List<A>) => B,
) => (xs: List<A>) => B = (onNil, onCons) => xs => fold_(xs, onNil, onCons);

export const foldLeft: <A, B>(
  z: B,
  f: (b: B, a: A) => B,
) => (xs: List<A>) => B = (z, f) => xs => foldLeft_(xs, z, f);

export const foldRight: <A, B>(
  z: B,
  f: (a: A, b: B) => B,
) => (xs: List<A>) => B = (z, f) => xs => foldRight_(xs, z, f);

export const foldMap: <M>(
  M: Monoid<M>,
) => <A>(f: (a: A) => M) => (xs: List<A>) => M = M => f => xs =>
  foldMap_(M, xs, f);

export const foldMapK: <F>(
  F: MonoidK<F>,
) => <A, B>(f: (a: A) => Kind<F, B>) => (xs: List<A>) => Kind<F, B> =
  F => f => xs =>
    foldMapK_(F, xs, f);

export const zip: <B>(ys: List<B>) => <A>(xs: List<A>) => List<[A, B]> =
  ys => xs =>
    zip_(xs, ys);

export const zipPad: <A2, B>(
  ys: List<B>,
  defaultX: () => A2,
  defaultY: () => B,
) => <A extends A2>(xs: List<A>) => List<[A2, B]> = (ys, dx, dy) => xs =>
  zipPad_(xs, ys, dx, dy);

export const zipWithIndex = <A>(xs: List<A>): List<[A, number]> => {
  const rs: [A, number][] = [];
  let idx = 0;
  while (nonEmpty(xs)) {
    rs.push([head(xs), idx++]);
    xs = tail(xs);
  }
  return fromArray(rs);
};

export const zipWith: <A, B, C>(
  ys: List<B>,
  f: (a: A, b: B) => C,
) => (xs: List<A>) => List<C> = (ys, f) => xs => zipWith_(xs, ys, f);

export const zipWithPad: <A, B, C>(
  ys: List<B>,
  defaultX: () => A,
  defaultY: () => B,
  f: (a: A, b: B) => C,
) => (xs: List<A>) => List<C> = (ys, dx, dy, f) => xs =>
  zipWithPad_(xs, ys, dx, dy, f);

export const collect: <A, B>(
  f: (a: A) => Option<B>,
) => (xs: List<A>) => List<B> = f => xs => collect_(xs, f);

export const collectWhile: <A, B>(
  f: (a: A) => Option<B>,
) => (xs: List<A>) => List<B> = f => xs => collectWhile_(xs, f);

export const scanLeft: <A, B>(
  z: B,
  f: (b: B, a: A) => B,
) => (xs: List<A>) => List<B> = (z, f) => xs => scanLeft_(xs, z, f);

export const scanLeft1: <A>(f: (x: A, y: A) => A) => (xs: List<A>) => List<A> =
  f => xs =>
    scanLeft1_(xs, f);

export const scanRight: <A, B>(
  z: B,
  f: (a: A, b: B) => B,
) => (xs: List<A>) => List<B> = (z, f) => xs => scanRight_(xs, z, f);

export const scanRight1: <A>(f: (x: A, y: A) => A) => (xs: List<A>) => List<A> =
  f => xs => scanRight1_(xs, f);

export const traverse: <G>(
  G: Applicative<G>,
) => <A, B>(f: (a: A) => Kind<G, B>) => (xs: List<A>) => Kind<G, List<B>> =
  G => f => xs =>
    traverse_(G, xs, f);

export const flatTraverse: <G>(
  G: Applicative<G>,
) => <A, B>(
  f: (a: A) => Kind<G, List<B>>,
) => (xs: List<A>) => Kind<G, List<B>> = G => f => xs =>
  flatTraverse_(G, xs, f);

export const sequence: <G>(
  G: Applicative<G>,
) => <A>(gxs: List<Kind<G, A>>) => Kind<G, List<A>> = G => traverse(G)(id);

export const flatSequence: <G>(
  G: Applicative<G>,
) => <A>(gxs: List<Kind<G, List<A>>>) => Kind<G, List<A>> = G =>
  flatTraverse(G)(id);

// -- Point-ful operators

export const equals_ = <A>(E: Eq<A>, xs: List<A>, ys: List<A>): boolean => {
  while (nonEmpty(xs) && nonEmpty(ys)) {
    if (E.notEquals(head(xs), head(ys))) return false;
    xs = tail(xs);
    ys = tail(ys);
  }
  return isEmpty(xs) && isEmpty(ys);
};

export const notEquals_ = <A>(E: Eq<A>, xs: List<A>, ys: List<A>): boolean =>
  !equals_(E, xs, ys);

export const prepend_ = <A>(xs: List<A>, x: A): List<A> => cons(x, xs);

export const concat_ = <A>(xs: List<A>, ys: List<A>): List<A> => {
  let result = ys;
  let lhs = reverse(xs);
  while (nonEmpty(lhs)) {
    result = cons(head(lhs), result);
    lhs = tail(lhs);
  }
  return result;
};

export const elem_ = <A>(xs: List<A>, idx: number): A => {
  while (idx-- > 0) {
    xs = tail(xs);
  }
  if (isEmpty(xs)) throw new Error('Index out of bounds');
  return head(xs);
};

export const all_ = <A>(xs: List<A>, p: (a: A) => boolean): boolean => {
  while (nonEmpty(xs)) {
    if (!p(head(xs))) return false;
    xs = tail(xs);
  }
  return true;
};

export const any_ = <A>(xs: List<A>, p: (a: A) => boolean): boolean => {
  while (nonEmpty(xs)) {
    if (p(head(xs))) return true;
    xs = tail(xs);
  }
  return false;
};

export const count_ = <A>(xs: List<A>, p: (a: A) => boolean): number => {
  let c = 0;
  while (nonEmpty(xs)) {
    if (p(head(xs))) c += 1;
    xs = tail(xs);
  }
  return c;
};

export const take_ = <A>(xs: List<A>, n: number): List<A> => {
  const results: A[] = [];
  while (nonEmpty(xs) && n-- > 0) {
    results.push(head(xs));
    xs = tail(xs);
  }
  return fromArray(results);
};

export const drop_ = <A>(xs: List<A>, n: number): List<A> => {
  while (nonEmpty(xs) && n-- > 0) {
    xs = tail(xs);
  }
  return xs;
};

export const slice_ = <A>(xs: List<A>, from: number, until: number): List<A> =>
  pipe(xs, drop(from), take(until - from));

export const filter_ = <A>(xs: List<A>, p: (a: A) => boolean): List<A> =>
  foldRight_(xs, empty as List<A>, (x, ys) => (p(x) ? cons(x, ys) : ys));

export const map_ = <A, B>(xs: List<A>, f: (a: A) => B): List<B> => {
  const rs: B[] = [];
  while (nonEmpty(xs)) {
    rs.push(f(head(xs)));
    xs = tail(xs);
  }
  return fromArray(rs);
};

export const tap_ = <A>(xs: List<A>, f: (a: A) => unknown): List<A> =>
  map_(xs, a => {
    f(a);
    return a;
  });

export const flatMap_ = <A, B>(xs: List<A>, f: (a: A) => List<B>): List<B> => {
  const rs: List<B>[] = [];
  while (nonEmpty(xs)) {
    rs.push(f(head(xs)));
    xs = tail(xs);
  }
  return rs.reduceRight((r, n) => concat_(n, r), empty);
};

export const fold_ = <A, B>(
  xs: List<A>,
  onNil: () => B,
  onCons: (head: A, tail: List<A>) => B,
): B => {
  const l = view(xs);
  return l.tag === 'cons' ? onCons(l._head, l._tail) : onNil();
};

export const foldLeft_ = <A, B>(xs: List<A>, z: B, f: (b: B, a: A) => B): B => {
  while (nonEmpty(xs)) {
    z = f(z, head(xs));
    xs = tail(xs);
  }
  return z;
};

export const foldLeft1_ = <A>(xs: List<A>, f: (x: A, y: A) => A): A =>
  foldLeft_(tail(xs), head(xs), f);

export const foldRight_ = <A, B>(
  xs: List<A>,
  z: B,
  f: (a: A, b: B) => B,
): B => {
  xs = reverse(xs);
  while (nonEmpty(xs)) {
    z = f(head(xs), z);
    xs = tail(xs);
  }
  return z;
};

export const foldRight1_ = <A>(xs: List<A>, f: (x: A, y: A) => A): A => {
  xs = reverse(xs);
  let z: A = head(xs);
  xs = tail(xs);
  while (nonEmpty(xs)) {
    z = f(head(xs), z);
    xs = tail(xs);
  }
  return z;
};

export const foldMap_ = <M, A>(M: Monoid<M>, xs: List<A>, f: (a: A) => M): M =>
  foldLeft_(xs, M.empty, (m, x) => M.combine(m, f(x)));

export const foldMapK_ = <F, A, B>(
  F: MonoidK<F>,
  xs: List<A>,
  f: (a: A) => Kind<F, B>,
): Kind<F, B> => foldMap_(F.algebra(), xs, f);

export const zip_ = <A, B>(xs: List<A>, ys: List<B>): List<[A, B]> =>
  zipWith_(xs, ys, (x, y) => [x, y]);

export const zipPad_ = <A, B>(
  xs: List<A>,
  ys: List<B>,
  defaultX: () => A,
  defaultY: () => B,
): List<[A, B]> => zipWithPad_(xs, ys, defaultX, defaultY, (x, y) => [x, y]);

export const zipWith_ = <A, B, C>(
  xs: List<A>,
  ys: List<B>,
  f: (a: A, b: B) => C,
): List<C> => {
  const rs: C[] = [];
  while (nonEmpty(xs) && nonEmpty(ys)) {
    rs.push(f(head(xs), head(ys)));
    xs = tail(xs);
    ys = tail(ys);
  }
  return fromArray(rs);
};

export const zipWithPad_ = <A, B, C>(
  xs: List<A>,
  ys: List<B>,
  defaultX: () => A,
  defaultY: () => B,
  f: (a: A, b: B) => C,
): List<C> => {
  const rs: C[] = [];
  while (nonEmpty(xs) || nonEmpty(ys)) {
    rs.push(
      f(
        nonEmpty(xs) ? head(xs) : defaultX(),
        nonEmpty(ys) ? head(ys) : defaultY(),
      ),
    );
    xs = tail(xs);
    ys = tail(ys);
  }
  return fromArray(rs);
};

export const collect_ = <A, B>(
  xs: List<A>,
  f: (a: A) => Option<B>,
): List<B> => {
  const rs: B[] = [];
  while (nonEmpty(xs)) {
    const r = f(head(xs));
    xs = tail(xs);
    if (r.isEmpty) continue;
    rs.push(r.get);
  }
  return fromArray(rs);
};

export const collectWhile_ = <A, B>(
  xs: List<A>,
  f: (a: A) => Option<B>,
): List<B> => {
  const rs: B[] = [];
  while (nonEmpty(xs)) {
    const r = f(head(xs));
    if (r.isEmpty) break;
    rs.push(r.get);
    xs = tail(xs);
  }
  return fromArray(rs);
};

export const scanLeft_ = <A, B>(
  xs: List<A>,
  z: B,
  f: (b: B, a: A) => B,
): List<B> => {
  const rs: B[] = [z];
  while (nonEmpty(xs)) {
    z = f(z, head(xs));
    rs.push(z);
    xs = tail(xs);
  }
  return fromArray(rs);
};

export const scanLeft1_ = <A>(xs: List<A>, f: (x: A, y: A) => A): List<A> =>
  scanLeft_(tail(xs), head(xs), f);

export const scanRight_ = <A, B>(
  xs: List<A>,
  z: B,
  f: (a: A, b: B) => B,
): List<B> => {
  xs = reverse(xs);
  let rs: List<B> = pure(z);
  while (nonEmpty(xs)) {
    z = f(head(xs), z);
    rs = cons(z, rs);
    xs = tail(xs);
  }
  return rs;
};

export const scanRight1_ = <A>(xs: List<A>, f: (x: A, y: A) => A): List<A> => {
  xs = reverse(xs);
  let z = head(xs);
  xs = tail(xs);
  let rs: List<A> = pure(z);
  while (nonEmpty(xs)) {
    z = f(head(xs), z);
    rs = cons(z, rs);
    xs = tail(xs);
  }
  return rs;
};

export const traverse_ = <G, A, B>(
  G: Applicative<G>,
  xs: List<A>,
  f: (a: A) => Kind<G, B>,
): Kind<G, List<B>> => {
  const consF = (x: A, ys: Kind<G, List<B>>): Kind<G, List<B>> =>
    G.map2(ys, f(x))(prepend_);
  return foldRight_(xs, G.pure(empty as List<B>), consF);
};

export const flatTraverse_ = <G, A, B>(
  G: Applicative<G>,
  xs: List<A>,
  f: (a: A) => Kind<G, List<B>>,
): Kind<G, List<B>> => {
  const concatF = (x: A, ys: Kind<G, List<B>>): Kind<G, List<B>> =>
    G.map2(f(x), ys)(concat_);

  return foldRight_(xs, G.pure(empty as List<B>), concatF);
};
