// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, id, pipe, throwError, tupled } from '@fp4ts/core';
import { Eq, Monoid, Ord } from '@fp4ts/cats-kernel';
import { Show } from '../../../show';
import { MonoidK } from '../../../monoid-k';
import { Applicative } from '../../../applicative';
import { Eval } from '../../../eval';
import { Apply, TraverseStrategy } from '../../../apply';

import { Ior } from '../../ior';
import { Either } from '../../either';
import { Option, None, Some } from '../../option';

import { Vector } from '../vector';
import { Iter } from '../iterator';
import { NonEmptyList } from '../non-empty-list';
import { Set as OrdSet } from '../set';

import { Cons, List } from './algebra';
import { cons, empty, fromArray, nil, pure } from './constructors';
import { ListBuffer } from './list-buffer';
import { View } from '../view';

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
  xs === nil ? None : Some([(xs as Cons<A>)._head, (xs as Cons<A>)._tail]);

export const popLast = <A>(xs: List<A>): Option<[A, List<A>]> => {
  let lst: A | undefined;
  let h: List<A> | undefined;
  let t: Cons<A> | undefined;

  while (xs !== nil) {
    const ys = xs as Cons<A>;
    lst = ys._head;
    if (!h) {
      h = empty;
    } else if (!t) {
      t = new Cons(ys._head, empty);
      h = t;
    } else {
      t._tail = new Cons(ys._head, empty);
    }
  }

  return h ? Some([lst!, h]) : None;
};

export const isEmpty = <A>(xs: List<A>): boolean => xs === nil;

export const nonEmpty = <A>(xs: List<A>): boolean => xs !== nil;

export const size = <A>(xs: List<A>): number => foldLeft_(xs, 0, n => n + 1);

export const view = <A>(xs: List<A>): View<A> => View.fromList(xs);

export const toArray = <A>(xs: List<A>): A[] => {
  const results: A[] = [];
  while (nonEmpty(xs)) {
    results.push(head(xs));
    xs = tail(xs);
  }
  return results;
};

export const toNel = <A>(xs: List<A>): Option<NonEmptyList<A>> =>
  NonEmptyList.fromList(xs);

export const toVector = <A>(xs: List<A>): Vector<A> => {
  let results: Vector<A> = Vector.empty;
  while (nonEmpty(xs)) {
    results = results.append(head(xs));
    xs = tail(xs);
  }
  return results;
};

export const iterator = <A>(xs: List<A>): Iterator<A> => {
  let it: List<A> = xs;
  return Iter.lift(() =>
    it.fold<IteratorResult<A>>(
      () => Iter.Result.done,
      (hd, tl) => {
        it = tl;
        return Iter.Result.pure(hd);
      },
    ),
  );
};

export const reverseIterator = <A>(xs: List<A>): Iterator<A> =>
  iterator(reverse(xs));

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
  while (xs !== nil) {
    result = new Cons((xs as Cons<A>)._head, result);
    xs = (xs as Cons<A>)._tail;
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

export const elemOption: (idx: number) => <A>(xs: List<A>) => Option<A> =
  idx => xs =>
    elemOption_(xs, idx);

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

export const flatMap: <A, B>(
  f: (a: A) => List<B>,
) => (xs: List<A>) => List<B> = f => xs => flatMap_(xs, f);

export const coflatMap: <A, B>(
  f: (as: List<A>) => B,
) => (xs: List<A>) => List<B> = f => xs => coflatMap_(xs, f);

export const flatten: <A>(xs: List<List<A>>) => List<A> = flatMap(id);

export const tailRecM: <A>(
  a: A,
) => <B>(f: (a: A) => List<Either<A, B>>) => List<B> = a => f =>
  tailRecM_(a, f);

export const fold: <A, B>(
  onNil: () => B,
  onCons: (head: A, tail: List<A>) => B,
) => (xs: List<A>) => B = (onNil, onCons) => xs => fold_(xs, onNil, onCons);

export const foldLeft: <A, B>(
  z: B,
  f: (b: B, a: A) => B,
) => (xs: List<A>) => B = (z, f) => xs => foldLeft_(xs, z, f);

export const foldMap: <M>(
  M: Monoid<M>,
) => <A>(f: (a: A) => M) => (xs: List<A>) => M = M => f => xs =>
  foldMap_(M)(xs, f);

export const foldMapK: <F>(
  F: MonoidK<F>,
) => <A, B>(f: (a: A) => Kind<F, [B]>) => (xs: List<A>) => Kind<F, [B]> =
  F => f => xs =>
    foldMapK_(F)(xs, f);

export const align: <B>(ys: List<B>) => <A>(xs: List<A>) => List<Ior<A, B>> =
  ys => xs =>
    align_(xs, ys);

export const zip: <B>(ys: List<B>) => <A>(xs: List<A>) => List<[A, B]> =
  ys => xs =>
    zip_(xs, ys);

export const zipAll: <A2, B>(
  ys: List<B>,
  defaultX: () => A2,
  defaultY: () => B,
) => <A extends A2>(xs: List<A>) => List<[A2, B]> = (ys, dx, dy) => xs =>
  zipAll_(xs, ys, dx, dy);

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

export const zipAllWith: <A, B, C>(
  ys: List<B>,
  defaultX: () => A,
  defaultY: () => B,
  f: (a: A, b: B) => C,
) => (xs: List<A>) => List<C> = (ys, dx, dy, f) => xs =>
  zipAllWith_(xs, ys, dx, dy, f);

export const collect: <A, B>(
  f: (a: A) => Option<B>,
) => (xs: List<A>) => List<B> = f => xs => collect_(xs, f);

export const collectWhile: <A, B>(
  f: (a: A) => Option<B>,
) => (xs: List<A>) => List<B> = f => xs => collectWhile_(xs, f);

export const forEach: <A>(f: (a: A) => void) => (xs: List<A>) => void =
  f => xs =>
    forEach_(xs, f);

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

export const scanRight1: <A>(
  f: (x: A, y: A) => A,
) => (xs: List<A>) => List<A> = f => xs => scanRight1_(xs, f);

export const traverse: <G>(
  G: Applicative<G>,
) => <A, B>(f: (a: A) => Kind<G, [B]>) => (xs: List<A>) => Kind<G, [List<B>]> =
  G => f => xs =>
    traverse_(G)(xs, f);

export const flatTraverse: <G>(
  G: Applicative<G>,
) => <A, B>(
  f: (a: A) => Kind<G, [List<B>]>,
) => (xs: List<A>) => Kind<G, [List<B>]> = G => f => xs =>
  flatTraverse_(G, xs, f);

export const sequence: <G>(
  G: Applicative<G>,
) => <A>(gxs: List<Kind<G, [A]>>) => Kind<G, [List<A>]> = G => traverse(G)(id);

export const flatSequence: <G>(
  G: Applicative<G>,
) => <A>(gxs: List<Kind<G, [List<A>]>>) => Kind<G, [List<A>]> = G =>
  flatTraverse(G)(id);

export const show: <A2>(S: Show<A2>) => <A extends A2>(xs: List<A>) => string =
  S => xs =>
    show_(S, xs);

// -- Point-ful operators

export const equals_ = <A>(E: Eq<A>, xs: List<A>, ys: List<A>): boolean => {
  while (xs !== nil && ys !== nil) {
    if (E.notEquals((xs as Cons<A>)._head, (ys as Cons<A>)._head)) return false;
    xs = (xs as Cons<A>)._tail;
    ys = (ys as Cons<A>)._tail;
  }
  return xs === nil && ys === nil;
};

export const notEquals_ = <A>(E: Eq<A>, xs: List<A>, ys: List<A>): boolean =>
  !equals_(E, xs, ys);

export const prepend_ = <A>(xs: List<A>, x: A): List<A> => cons(x, xs);

export const append_ = <A>(xs: List<A>, x: A): List<A> => {
  if (xs === nil) return pure(x);
  const result = new Cons((xs as Cons<A>)._head, nil);
  let tlx = result;
  let cur = (xs as Cons<A>)._tail;

  while (cur !== nil) {
    const tmp = new Cons((cur as Cons<A>)._head, nil);
    tlx._tail = tmp;
    tlx = tmp;
    cur = (cur as Cons<A>)._tail;
  }

  tlx._tail = pure(x);

  return result;
};

export const concat_ = <A>(xs: List<A>, ys: List<A>): List<A> => {
  if (xs === nil) return ys;
  if (ys === nil) return xs;

  const result = new Cons((xs as Cons<A>)._head, ys);
  let cur = result;
  xs = (xs as Cons<A>)._tail;
  while (xs !== nil) {
    const temp = new Cons((xs as Cons<A>)._head, ys);
    cur._tail = temp;
    cur = temp;
    xs = (xs as Cons<A>)._tail;
  }
  return result;
};

export const elem_ = <A>(xs: List<A>, idx: number): A =>
  elemOption_(xs, idx).fold(
    () => throwError(new RangeError('Index Out Of Bounds')),
    id,
  );

export const elemOption_ = <A>(xs: List<A>, idx: number): Option<A> => {
  if (idx < 0) return None;
  while (idx-- > 0 && xs !== nil) {
    xs = (xs as Cons<A>)._tail;
  }
  return xs === nil ? None : Some((xs as Cons<A>)._head);
};

export const all_ = <A>(xs: List<A>, p: (a: A) => boolean): boolean => {
  while (xs !== nil) {
    if (!p((xs as Cons<A>)._head)) return false;
    xs = (xs as Cons<A>)._tail;
  }
  return true;
};

export const any_ = <A>(xs: List<A>, p: (a: A) => boolean): boolean => {
  while (xs !== nil) {
    if (p((xs as Cons<A>)._head)) return true;
    xs = (xs as Cons<A>)._tail;
  }
  return false;
};

export const count_ = <A>(xs: List<A>, p: (a: A) => boolean): number => {
  let c = 0;
  while (xs !== nil) {
    if (p((xs as Cons<A>)._head)) c += 1;
    xs = (xs as Cons<A>)._tail;
  }
  return c;
};

export const take_ = <A>(xs: List<A>, n: number): List<A> => {
  if (xs === nil || n-- <= 0) return nil;

  const result = new Cons((xs as Cons<A>)._head, nil);
  let cur = result;
  xs = (xs as Cons<A>)._tail;
  while (xs !== nil && n-- > 0) {
    const tmp = new Cons((xs as Cons<A>)._head, nil);
    cur._tail = tmp;
    cur = tmp;
    xs = (xs as Cons<A>)._tail;
  }
  return result;
};

export const takeWhile_ = <A>(xs: List<A>, f: (a: A) => boolean): List<A> => {
  if (xs === nil || !f((xs as Cons<A>)._head)) return nil;

  const result = new Cons((xs as Cons<A>)._head, nil);
  let cur = result;
  xs = (xs as Cons<A>)._tail;
  while (xs !== nil && f((xs as Cons<A>)._head)) {
    const tmp = new Cons((xs as Cons<A>)._head, nil);
    cur._tail = tmp;
    cur = tmp;
    xs = (xs as Cons<A>)._tail;
  }
  return result;
};

export const takeRight_ = <A>(xs: List<A>, n: number): List<A> => {
  let lag = xs;
  let lead = drop_(xs, n);
  while (lead !== nil) {
    lag = (lag as Cons<A>)._tail;
    lead = (lead as Cons<A>)._tail;
  }
  return lag;
};

export const drop_ = <A>(xs: List<A>, n: number): List<A> => {
  while (xs !== nil && n-- > 0) {
    xs = (xs as Cons<A>)._tail;
  }
  return xs;
};

export const dropWhile_ = <A>(xs: List<A>, f: (a: A) => boolean): List<A> => {
  while (xs !== nil && f((xs as Cons<A>)._head)) {
    xs = (xs as Cons<A>)._tail;
  }
  return xs;
};

export const dropRight_ = <A>(xs: List<A>, n: number): List<A> => {
  let lead = drop_(xs, n);
  let h: Cons<A> | undefined;
  let t: Cons<A> | undefined;
  while (lead !== nil) {
    const nx = new Cons((xs as Cons<A>)._head, nil);
    if (!h) {
      h = nx;
    } else {
      t!._tail = nx;
    }
    t = nx;
    xs = (xs as Cons<A>)._tail;
    lead = (lead as Cons<A>)._tail;
  }
  return h ?? nil;
};

export const slice_ = <A>(xs: List<A>, from: number, until: number): List<A> =>
  pipe(xs, drop(from), take(until - from));

export const splitAt_ = <A>(xs: List<A>, idx: number): [List<A>, List<A>] => {
  const b = new ListBuffer<A>();
  let i = 0;
  while (xs !== nil && i++ < idx) {
    b.addOne((xs as Cons<A>)._head);
    xs = (xs as Cons<A>)._tail;
  }
  return [b.toList, xs];
};

// -- Ref: https://github.com/scala/scala/blob/v2.13.9/src/library/scala/collection/immutable/List.scala#L502
export const filter_ = <A>(xs: List<A>, p: (a: A) => boolean): List<A> =>
  _filterNoneIn(xs, p, false);

export const filterNot_ = <A>(xs: List<A>, p: (a: A) => boolean): List<A> =>
  _filterNoneIn(xs, p, true);

const _filterNoneIn = <A>(
  xs: List<A>,
  p: (a: A) => boolean,
  isFlipped: boolean,
): List<A> => {
  while (xs !== nil) {
    if (p((xs as Cons<A>)._head) !== isFlipped) {
      return _filterAllIn(xs, (xs as Cons<A>)._tail, p, isFlipped);
    }
    xs = (xs as Cons<A>)._tail;
  }
  return nil;
};

const _filterAllIn = <A>(
  start: List<A>,
  rem: List<A>,
  p: (a: A) => boolean,
  isFlipped: boolean,
): List<A> => {
  while (rem !== nil) {
    if (p((rem as Cons<A>).head) === isFlipped) {
      return _filterPartialFill(start, rem, p, isFlipped);
    }
    rem = (rem as Cons<A>)._tail;
  }
  return start;
};

const _filterPartialFill = <A>(
  origStart: List<A>,
  firstMiss: List<A>,
  p: (a: A) => boolean,
  isFlipped: boolean,
): List<A> => {
  const newHead = new Cons((origStart as Cons<A>)._head, nil);
  let toProcess = (origStart as Cons<A>)._tail;
  let currLast = newHead;

  while (toProcess !== firstMiss) {
    const tmp = new Cons((toProcess as Cons<A>)._head, nil);
    currLast._tail = tmp;
    currLast = tmp;
    toProcess = (toProcess as Cons<A>)._tail;
  }

  let next = (firstMiss as Cons<A>)._tail;
  let nextToCopy = next;
  while (next !== nil) {
    const x = (next as Cons<A>)._head;
    if (p(x) !== isFlipped) {
      next = (next as Cons<A>)._tail;
    } else {
      while (nextToCopy !== next) {
        const tmp = new Cons((nextToCopy as Cons<A>)._head, nil);
        currLast._tail = tmp;
        currLast = tmp;
        nextToCopy = (nextToCopy as Cons<A>)._tail;
      }
      nextToCopy = (next as Cons<A>)._tail;
      next = (next as Cons<A>)._tail;
    }
  }

  if (nextToCopy !== nil) {
    currLast._tail = nextToCopy;
  }

  return newHead;
};

export const map_ = <A, B>(xs: List<A>, f: (a: A) => B): List<B> => {
  if (xs === nil) return nil;

  const result = new Cons(f((xs as Cons<A>)._head), nil);
  let cur = result;
  xs = (xs as Cons<A>)._tail;
  while (xs !== nil) {
    const tmp = new Cons(f((xs as Cons<A>)._head), nil);
    cur._tail = tmp;
    cur = tmp;
    xs = (xs as Cons<A>)._tail;
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

  while (xs !== nil) {
    let bs = f((xs as Cons<A>)._head);

    while (bs !== nil) {
      const nx = new Cons((bs as Cons<B>)._head, nil);
      if (!t) {
        h = nx;
      } else {
        t!._tail = nx;
      }
      t = nx;

      bs = (bs as Cons<B>)._tail;
    }

    xs = (xs as Cons<A>)._tail;
  }

  return h ?? nil;
};

export const coflatMap_ = <A, B>(
  xs: List<A>,
  f: (xs: List<A>) => B,
): List<B> => {
  const buf = new ListBuffer<B>();
  while (xs !== nil) {
    buf.addOne(f(xs));
    xs = (xs as Cons<A>)._tail;
  }
  return buf.toList;
};

export const fold_ = <A, B1, B2 = B1>(
  xs: List<A>,
  onNil: () => B1,
  onCons: (head: A, tail: List<A>) => B2,
): B1 | B2 =>
  xs === nil ? onNil() : onCons((xs as Cons<A>)._head, (xs as Cons<A>)._tail);

export const tailRecM_ = <A, B>(
  a: A,
  f: (a: A) => List<Either<A, B>>,
): List<B> => {
  let stack: List<List<Either<A, B>>> = pure(f(a));
  const buf = new ListBuffer<B>();

  while (nonEmpty(stack)) {
    const xhd = head(stack);
    const xtl = tail(stack);

    if (isEmpty(xhd)) {
      stack = xtl;
      continue;
    }

    const nx = head(xhd);
    nx.fold(
      a => {
        stack = new Cons(f(a), new Cons(tail(xhd), xtl));
      },
      b => {
        buf.addOne(b);
        stack = cons(tail(xhd), xtl);
      },
    );
  }

  return buf.toList;
};

export const foldLeft_ = <A, B>(xs: List<A>, z: B, f: (b: B, a: A) => B): B => {
  while (xs !== nil) {
    z = f(z, (xs as Cons<A>)._head);
    xs = (xs as Cons<A>)._tail;
  }
  return z;
};

export const foldLeft1_ = <A>(xs: List<A>, f: (x: A, y: A) => A): A =>
  foldLeft_(tail(xs), head(xs), f);

export const foldRight_ = <A, B>(
  xs: List<A>,
  ez: Eval<B>,
  f: (a: A, eb: Eval<B>) => Eval<B>,
): Eval<B> => {
  const go = (xs: List<A>): Eval<B> =>
    xs.isEmpty
      ? ez
      : f(
          xs.head,
          Eval.defer(() => go(xs.tail)),
        );
  return Eval.defer(() => go(xs));
};

export const foldRight1_ = <A>(
  xs: List<A>,
  f: (a: A, eb: Eval<A>) => Eval<A>,
): Eval<A> => {
  const go = (xs: List<A>): Eval<A> =>
    xs === nil
      ? throwError(new Error('Nil.foldr1'))
      : (xs as Cons<A>)._tail === nil
      ? Eval.now((xs as Cons<A>)._head)
      : f(
          (xs as Cons<A>)._head,
          Eval.defer(() => go((xs as Cons<A>)._tail)),
        );

  return Eval.defer(() => go(xs));
};

export const foldRightStrict_ = <A, B>(
  xs: List<A>,
  z: B,
  f: (a: A, b: B) => B,
): B => {
  xs = reverse(xs);
  while (xs !== nil) {
    z = f((xs as Cons<A>)._head, z);
    xs = (xs as Cons<A>)._tail;
  }
  return z;
};

export const foldRight1Strict_ = <A>(xs: List<A>, f: (x: A, y: A) => A): A => {
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
    foldLeft_(xs, M.empty, (m, x) => M.combine_(m, () => f(x)));

export const foldMapK_ =
  <F>(F: MonoidK<F>) =>
  <A, B>(xs: List<A>, f: (a: A) => Kind<F, [B]>): Kind<F, [B]> =>
    foldRight_(xs, Eval.now(F.emptyK<B>()), (a, efb) =>
      F.combineKEval_(f(a), efb),
    ).value;

export const align_ = <A, B>(xs: List<A>, ys: List<B>): List<Ior<A, B>> =>
  zipAllWith_(
    map_(xs, Some),
    map_(ys, Some),
    () => None,
    () => None,
    (oa, ob) => Ior.fromOptions(oa, ob).get,
  );

export const zip_ = <A, B>(xs: List<A>, ys: List<B>): List<[A, B]> =>
  zipWith_(xs, ys, tupled);

export const zipAll_ = <A, B>(
  xs: List<A>,
  ys: List<B>,
  defaultX: () => A,
  defaultY: () => B,
): List<[A, B]> => zipAllWith_(xs, ys, defaultX, defaultY, tupled);

export const zipWith_ = <A, B, C>(
  xs: List<A>,
  ys: List<B>,
  f: (a: A, b: B) => C,
): List<C> => {
  if (xs === nil || ys === nil) return nil;

  const result = new Cons(f((xs as Cons<A>)._head, (ys as Cons<B>)._head), nil);
  let cur = result;
  xs = (xs as Cons<A>)._tail;
  ys = (ys as Cons<B>)._tail;
  while (xs !== nil && ys !== nil) {
    const tmp = new Cons(f((xs as Cons<A>)._head, (ys as Cons<B>)._head), nil);
    cur._tail = tmp;
    cur = tmp;
    xs = (xs as Cons<A>)._tail;
    ys = (ys as Cons<B>)._tail;
  }
  return result;
};

export const zipAllWith_ = <A, B, C>(
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

  while (xs !== nil) {
    const r = f((xs as Cons<A>)._head);
    xs = (xs as Cons<A>)._tail;
    if (r.isEmpty) continue;

    const nx = new Cons(r.get, nil);
    if (!h) {
      h = nx;
    } else {
      t!._tail = nx;
    }
    t = nx;
  }

  return h ?? nil;
};

export const collectWhile_ = <A, B>(
  xs: List<A>,
  f: (a: A) => Option<B>,
): List<B> => {
  let h: Cons<B> | undefined;
  let t: Cons<B> | undefined;

  while (xs !== nil) {
    const r = f((xs as Cons<A>)._head);
    xs = (xs as Cons<A>)._tail;
    if (r.isEmpty) break;

    const nx = new Cons(r.get, nil);
    if (!h) {
      h = nx;
    } else {
      t!._tail = nx;
    }
    t = nx;
  }

  return h ?? nil;
};

export const forEach_ = <A>(xs: List<A>, f: (a: A) => void): void => {
  while (xs !== nil) {
    f((xs as Cons<A>)._head);
    xs = (xs as Cons<A>)._tail;
  }
};

export const partition_ = <A, L, R>(
  xs: List<A>,
  f: (a: A) => Either<L, R>,
): [List<L>, List<R>] => {
  let hl: Cons<L> | undefined;
  let tl: Cons<L> | undefined;
  let hr: Cons<R> | undefined;
  let tr: Cons<R> | undefined;

  while (xs !== nil) {
    const r = f((xs as Cons<A>)._head);
    if (r.isLeft) {
      const nx = new Cons(r.getLeft, nil);
      if (!hl) {
        hl = nx;
      } else {
        tl!._tail = nx;
      }
      tl = nx;
    } else {
      const nx = new Cons(r.get, nil);
      if (!hr) {
        hr = nx;
      } else {
        tr!._tail = nx;
      }
      tr = nx;
    }

    xs = (xs as Cons<A>)._tail;
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
  while (xs !== nil) {
    z = f(z, (xs as Cons<A>)._head);
    const tmp = new Cons(z, nil);
    cur._tail = tmp;
    cur = tmp;
    xs = (xs as Cons<A>)._tail;
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
  while (xs !== nil) {
    z = f((xs as Cons<A>)._head, z);
    rs = new Cons(z, rs);
    xs = (xs as Cons<A>)._tail;
  }
  return rs;
};

export const scanRight1_ = <A>(xs: List<A>, f: (x: A, y: A) => A): List<A> => {
  xs = reverse(xs);
  let z = head(xs);
  xs = tail(xs);
  let rs: List<A> = pure(z);
  while (xs !== nil) {
    z = f((xs as Cons<A>)._head, z);
    rs = new Cons(z, rs);
    xs = (xs as Cons<A>)._tail;
  }
  return rs;
};

export const distinctBy_ = <A, B>(xs: List<A>, f: (a: A) => B): List<A> => {
  const set = new Set<B>();
  return filter_(xs, x => {
    const y = f(x);
    if (set.has(y)) {
      return false;
    } else {
      set.add(y);
      return true;
    }
  });
};

export const distinctByOrd_ = <A, B>(
  xs: List<A>,
  f: (a: A) => B,
  O: Ord<B>,
): List<A> => {
  let set: OrdSet<B> = OrdSet.empty;
  return filter_(xs, x => {
    const y = f(x);
    if (set.contains(O, y)) {
      return false;
    } else {
      set = set.insert(O, y);
      return true;
    }
  });
};

export const traverse_ =
  <G>(G: Applicative<G>) =>
  <A, B>(xs: List<A>, f: (a: A) => Kind<G, [B]>): Kind<G, [List<B>]> =>
    Apply.TraverseStrategy(G)(<Rhs>(Rhs: TraverseStrategy<G, Rhs>) => {
      const go = (xs: List<A>): Kind<Rhs, [Kind<G, [List<B>]>]> =>
        xs === nil
          ? Rhs.toRhs(() => G.pure(nil))
          : Rhs.map2Rhs(
              f((xs as Cons<A>)._head),
              Rhs.defer(() => go((xs as Cons<A>)._tail)),
            )(cons);

      return Rhs.toG(Rhs.defer(() => go(xs)));
    });

export const traverseFilter_ =
  <G>(G: Applicative<G>) =>
  <A, B>(xs: List<A>, f: (a: A) => Kind<G, [Option<B>]>): Kind<G, [List<B>]> =>
    Apply.TraverseStrategy(G)(<Rhs>(Rhs: TraverseStrategy<G, Rhs>) => {
      const go = (xs: List<A>): Kind<Rhs, [Kind<G, [List<B>]>]> =>
        xs === nil
          ? Rhs.toRhs(() => G.pure(nil))
          : Rhs.map2Rhs(
              f((xs as Cons<A>)._head),
              Rhs.defer(() => go((xs as Cons<A>)._tail)),
            )((y, ys) => (y.nonEmpty ? cons(y.get, ys) : ys));

      return Rhs.toG(Rhs.defer(() => go(xs)));
    });

export const flatTraverse_ = <G, A, B>(
  G: Applicative<G>,
  xs: List<A>,
  f: (a: A) => Kind<G, [List<B>]>,
): Kind<G, [List<B>]> => {
  const concatF = (
    x: A,
    eys: Eval<Kind<G, [List<B>]>>,
  ): Eval<Kind<G, [List<B>]>> => G.map2Eval_(f(x), eys)(concat_);

  return foldRight_(xs, Eval.now(G.pure(empty as List<B>)), concatF).value;
};

// -- Ref: https://hackage.haskell.org/package/base-4.17.0.0/docs/src/Data.OldList.html#sortBy
export const sort_ = <A>(xs: List<A>, O: Ord<A>): List<A> =>
  fromArray(toArray(xs).sort((a, b) => O.compare(a, b) - 1));

export const show_ = <A>(S: Show<A>, xs: List<A>): string => {
  const values = toArray(xs).map(S.show).join(', ');
  return `List(${values})`;
};
