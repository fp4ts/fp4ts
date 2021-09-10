import { Kind, id, pipe } from '../../../core';
import { Eq } from '../../eq';
import { Show } from '../../show';
import { Monoid } from '../../monoid';
import { MonoidK } from '../../monoid-k';
import { Applicative } from '../../applicative';
import { Either } from '../either';
import { Option, None, Some } from '../option';

import { Cons, List, view } from './algebra';
import { cons, empty, nil, pure } from './constructors';

const throwError = (e: Error) => {
  throw e;
};

export const head = <A>(xs: List<A>): A =>
  headOption(xs).fold(() => throwError(new Error('Nil.head')), id);

export const headOption = <A>(xs: List<A>): Option<A> =>
  fold_(
    xs,
    () => None,
    h => Some(h),
  );

export const tail = <A>(xs: List<A>): List<A> =>
  fold_(
    xs,
    () => empty,
    (_, t) => t,
  );

export const init = <A>(xs: List<A>): List<A> => dropRight_(xs, 1);

export const last = <A>(xs: List<A>): A =>
  lastOption(xs).fold(() => throwError(new Error('Nil.last')), id);

export const lastOption = <A>(xs: List<A>): Option<A> => {
  let l: Option<A> = None;
  while (nonEmpty(xs)) {
    l = Some(head(xs));
    xs = tail(xs);
  }
  return l;
};

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

export const takeRight: (n: number) => <A>(xs: List<A>) => List<A> = n => xs =>
  take_(xs, n);

export const drop: (n: number) => <A>(xs: List<A>) => List<A> = n => xs =>
  drop_(xs, n);

export const dropRight: (n: number) => <A>(xs: List<A>) => List<A> = n => xs =>
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
  foldMap_(M)(xs, f);

export const foldMapK: <F>(
  F: MonoidK<F>,
) => <C, S, R, E, A, B>(
  f: (a: A) => Kind<F, C, S, R, E, B>,
) => (xs: List<A>) => Kind<F, C, S, R, E, B> = F => f => xs =>
  foldMapK_(F)(xs, f);

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
  if (isEmpty(xs)) return nil;

  let idx = 0;
  const result: Cons<[A, number]> = new Cons([head(xs), idx++], nil);
  let cur = result;
  xs = tail(xs);
  while (nonEmpty(xs)) {
    const tmp: Cons<[A, number]> = new Cons([head(xs), idx++], nil);
    cur._tail = tmp;
    cur = tmp;
    xs = tail(xs);
  }
  return result;
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

export const partition: <A, L, R>(
  f: (a: A) => Either<L, R>,
) => (xs: List<A>) => [List<L>, List<R>] = f => xs => partition_(xs, f);

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
) => <C, S, R, E, A, B>(
  f: (a: A) => Kind<G, C, S, R, E, B>,
) => (xs: List<A>) => Kind<G, C, S, R, E, List<B>> = G => f => xs =>
  traverse_(G)(xs, f);

export const flatTraverse: <G>(
  G: Applicative<G>,
) => <C, S, R, E, A, B>(
  f: (a: A) => Kind<G, C, S, R, E, List<B>>,
) => (xs: List<A>) => Kind<G, C, S, R, E, List<B>> = G => f => xs =>
  flatTraverse_(G, xs, f);

export const sequence: <G>(
  G: Applicative<G>,
) => <C, S, R, E, A>(
  gxs: List<Kind<G, C, S, R, E, A>>,
) => Kind<G, C, S, R, E, List<A>> = G => traverse(G)(id);

export const flatSequence: <G>(
  G: Applicative<G>,
) => <C, S, R, E, A>(
  gxs: List<Kind<G, C, S, R, E, List<A>>>,
) => Kind<G, C, S, R, E, List<A>> = G => flatTraverse(G)(id);

export const show: <A2>(S: Show<A2>) => <A extends A2>(xs: List<A>) => string =
  S => xs =>
    show_(S, xs);

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
  if (isEmpty(xs)) return ys;
  if (isEmpty(ys)) return xs;

  const result = new Cons(head(xs), ys);
  let cur = result;
  xs = tail(xs);
  while (nonEmpty(xs)) {
    const temp = new Cons(head(xs), ys);
    cur._tail = temp;
    cur = temp;
    xs = tail(xs);
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
  if (isEmpty(xs) || n-- <= 0) return nil;

  const result = new Cons(head(xs), nil);
  let cur = result;
  xs = tail(xs);
  while (nonEmpty(xs) && n-- > 0) {
    const tmp = new Cons(head(xs), nil);
    cur._tail = tmp;
    cur = tmp;
    xs = tail(xs);
  }
  return result;
};

export const takeRight_ = <A>(xs: List<A>, n: number): List<A> => {
  let lag = xs;
  let lead = drop_(xs, n);
  while (nonEmpty(lead)) {
    lag = tail(lag);
    lead = tail(lead);
  }
  return lag;
};

export const drop_ = <A>(xs: List<A>, n: number): List<A> => {
  while (nonEmpty(xs) && n-- > 0) {
    xs = tail(xs);
  }
  return xs;
};

export const dropRight_ = <A>(xs: List<A>, n: number): List<A> => {
  let lead = drop_(xs, n);
  let h: Cons<A> | undefined;
  let t: Cons<A> | undefined;
  while (nonEmpty(lead)) {
    const nx = new Cons(head(xs), nil);
    if (!h) {
      h = nx;
    } else {
      t!._tail = nx;
    }
    t = nx;
    xs = tail(xs);
    lead = tail(lead);
  }
  return h ? h : nil;
};

export const slice_ = <A>(xs: List<A>, from: number, until: number): List<A> =>
  pipe(xs, drop(from), take(until - from));

export const splitAt_ = <A>(xs: List<A>, idx: number): [List<A>, List<A>] => {
  if (isEmpty(xs) || idx-- < 0) return [nil, xs];

  const ys = new Cons(head(xs), nil);
  let cur = ys;
  xs = tail(xs);
  while (nonEmpty(xs) && idx-- > 0) {
    const tmp = new Cons(head(xs), nil);
    cur._tail = tmp;
    cur = tmp;
    xs = tail(xs);
  }
  return [ys, xs];
};

export const filter_ = <A>(xs: List<A>, p: (a: A) => boolean): List<A> =>
  foldRight_(xs, empty as List<A>, (x, ys) => (p(x) ? cons(x, ys) : ys));

export const map_ = <A, B>(xs: List<A>, f: (a: A) => B): List<B> => {
  if (isEmpty(xs)) return nil;

  const result = new Cons(f(head(xs)), nil);
  let cur = result;
  xs = tail(xs);
  while (nonEmpty(xs)) {
    const tmp = new Cons(f(head(xs)), nil);
    cur._tail = tmp;
    cur = tmp;
    xs = tail(xs);
  }
  return result;
};

export const tap_ = <A>(xs: List<A>, f: (a: A) => unknown): List<A> =>
  map_(xs, a => {
    f(a);
    return a;
  });

export const flatMap_ = <A, B>(xs: List<A>, f: (a: A) => List<B>): List<B> => {
  let h: Cons<B> | undefined;
  let t: Cons<B> | undefined;

  while (nonEmpty(xs)) {
    let bs = f(head(xs));

    while (nonEmpty(bs)) {
      const nx = new Cons(head(bs), nil);
      if (!t) {
        h = nx;
      } else {
        t!._tail = nx;
      }
      t = nx;

      bs = tail(bs);
    }

    xs = tail(xs);
  }

  return h ? h : nil;
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

export const foldMap_ =
  <M>(M: Monoid<M>) =>
  <A>(xs: List<A>, f: (a: A) => M): M =>
    foldLeft_(xs, M.empty, (m, x) => M.combine_(m, f(x)));

export const foldMapK_ =
  <F>(F: MonoidK<F>) =>
  <C, S, R, E, A, B>(
    xs: List<A>,
    f: (a: A) => Kind<F, C, S, R, E, B>,
  ): Kind<F, C, S, R, E, B> =>
    foldMap_(F.algebra<S, R, E, B>())(xs, f);

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
  if (isEmpty(xs) || isEmpty(ys)) return nil;

  const result = new Cons(f(head(xs), head(ys)), nil);
  let cur = result;
  xs = tail(xs);
  ys = tail(ys);
  while (nonEmpty(xs) && nonEmpty(ys)) {
    const tmp = new Cons(f(head(xs), head(ys)), nil);
    cur._tail = tmp;
    cur = tmp;
    xs = tail(xs);
    ys = tail(ys);
  }
  return result;
};

export const zipWithPad_ = <A, B, C>(
  xs: List<A>,
  ys: List<B>,
  defaultX: () => A,
  defaultY: () => B,
  f: (a: A, b: B) => C,
): List<C> => {
  if (isEmpty(xs) && isEmpty(ys)) return nil;

  const result = new Cons(
    f(
      fold_(xs, defaultX, h => h),
      fold_(ys, defaultY, h => h),
    ),
    nil,
  );
  let cur = result;
  xs = tail(xs);
  ys = tail(ys);

  while (nonEmpty(xs) || nonEmpty(ys)) {
    const tmp = new Cons(
      f(
        fold_(xs, defaultX, h => h),
        fold_(ys, defaultY, h => h),
      ),
      nil,
    );
    cur._tail = tmp;
    cur = tmp;
    xs = tail(xs);
    ys = tail(ys);
  }

  return result;
};

export const collect_ = <A, B>(
  xs: List<A>,
  f: (a: A) => Option<B>,
): List<B> => {
  let h: Cons<B> | undefined;
  let t: Cons<B> | undefined;

  while (nonEmpty(xs)) {
    const r = f(head(xs));
    xs = tail(xs);
    if (r.isEmpty) continue;

    const nx = new Cons(r.get, nil);
    if (!h) {
      h = nx;
    } else {
      t!._tail = nx;
    }
    t = nx;
  }

  return h ? h : nil;
};

export const collectWhile_ = <A, B>(
  xs: List<A>,
  f: (a: A) => Option<B>,
): List<B> => {
  let h: Cons<B> | undefined;
  let t: Cons<B> | undefined;

  while (nonEmpty(xs)) {
    const r = f(head(xs));
    xs = tail(xs);
    if (r.isEmpty) break;

    const nx = new Cons(r.get, nil);
    if (!h) {
      h = nx;
    } else {
      t!._tail = nx;
    }
    t = nx;
  }

  return h ? h : nil;
};

export const partition_ = <A, L, R>(
  xs: List<A>,
  f: (a: A) => Either<L, R>,
): [List<L>, List<R>] => {
  let hl: Cons<L> | undefined;
  let tl: Cons<L> | undefined;
  let hr: Cons<R> | undefined;
  let tr: Cons<R> | undefined;

  while (nonEmpty(xs)) {
    const r = f(head(xs));
    r.fold(
      l => {
        const nx = new Cons(l, nil);
        if (!hl) {
          hl = nx;
        } else {
          tl!._tail = nx;
        }
        tl = nx;
      },
      r => {
        const nx = new Cons(r, nil);
        if (!hr) {
          hr = nx;
        } else {
          tr!._tail = nx;
        }
        tr = nx;
      },
    );

    xs = tail(xs);
  }

  return [hl ? hl : nil, hr ? hr : nil];
};

export const scanLeft_ = <A, B>(
  xs: List<A>,
  z: B,
  f: (b: B, a: A) => B,
): List<B> => {
  const result = new Cons(z, nil);
  let cur = result;
  while (nonEmpty(xs)) {
    z = f(z, head(xs));
    const tmp = new Cons(z, nil);
    cur._tail = tmp;
    cur = tmp;
    xs = tail(xs);
  }
  return result;
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

export const traverse_ =
  <G>(G: Applicative<G>) =>
  <C, S, R, E, A, B>(
    xs: List<A>,
    f: (a: A) => Kind<G, C, S, R, E, B>,
  ): Kind<G, C, S, R, E, List<B>> => {
    const consF = (
      x: A,
      ys: Kind<G, C, S, R, E, List<B>>,
    ): Kind<G, C, S, R, E, List<B>> => G.map2_(ys, f(x))(prepend_);
    return foldRight_(xs, G.pure(empty as List<B>), consF);
  };

export const flatTraverse_ = <G, C, S, R, E, A, B>(
  G: Applicative<G>,
  xs: List<A>,
  f: (a: A) => Kind<G, C, S, R, E, List<B>>,
): Kind<G, C, S, R, E, List<B>> => {
  const concatF = (
    x: A,
    ys: Kind<G, C, S, R, E, List<B>>,
  ): Kind<G, C, S, R, E, List<B>> => G.map2_(f(x), ys)(concat_);

  return foldRight_(xs, G.pure(empty as List<B>), concatF);
};

export const show_ = <A>(S: Show<A>, xs: List<A>): string => {
  const values = toArray(xs).map(S.show).join(', ');
  return `[${values}]`;
};
