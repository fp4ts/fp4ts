// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, fst, snd, throwError, pipe, id, tupled } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Foldable } from '../../../foldable';
import { Applicative } from '../../../applicative';
import { Ior } from '../../ior';
import { Option, None, Some } from '../../option';
import { Apply, TraverseStrategy } from '../../../apply';

import { Iter } from '../iterator';
import { List } from '../list';
import { Vector } from '../vector';
import { Array as CatsArray } from '../array';

import { Chain, Concat, Empty, NonEmpty, view } from './algebra';
import { empty, fromArray, fromList, fromVector, pure } from './constructors';

export const isEmpty = <A>(c: Chain<A>): boolean => c === Empty;

export const nonEmpty = <A>(c: Chain<A>): boolean => c !== Empty;

export const head = <A>(c: Chain<A>): A =>
  uncons(c).fold(() => throwError(new Error('Empty.head')), fst);

export const headOption = <A>(c: Chain<A>): Option<A> => uncons(c).map(fst);
export const tail = <A>(c: Chain<A>): Chain<A> =>
  uncons(c)
    .map(snd)
    .getOrElse(() => Empty);

export const last = <A>(c: Chain<A>): A =>
  popLast(c).fold(() => throwError(new Error('Empty.last')), fst);
export const lastOption = <A>(c: Chain<A>): Option<A> => popLast(c).map(fst);
export const init = <A>(c: Chain<A>): Chain<A> =>
  popLast(c)
    .map(snd)
    .getOrElse(() => Empty);

export const popHead = <A>(c: Chain<A>): Option<[A, Chain<A>]> => {
  let _cur: Chain<A> = c;
  let result: [A, Chain<A>] | undefined;
  let sfx: NonEmpty<A> | undefined;

  while (!result) {
    const cur = view(_cur);
    switch (cur.tag) {
      case 'empty':
        return None;

      case 'singleton':
        result = sfx ? [cur.value, sfx] : [cur.value, Empty];
        break;

      case 'concat':
        sfx = sfx ? new Concat(cur.rhs, sfx) : cur.rhs;
        _cur = cur.lhs;
        break;

      case 'wrap': {
        const [hd, tl] = cur.instance.toVector<A>(cur.values).popHead.get;
        sfx = (
          sfx ? concat_(fromVector(tl), sfx) : fromVector(tl)
        ) as NonEmpty<A>;
        result = [hd, sfx];
        break;
      }
    }
  }

  return Some(result);
};
export const uncons: <A>(c: Chain<A>) => Option<[A, Chain<A>]> = popHead;

export const popLast = <A>(c: Chain<A>): Option<[A, Chain<A>]> => {
  let _cur: Chain<A> = c;
  let result: [A, Chain<A>] | undefined;
  let pfx: NonEmpty<A> | undefined;

  while (!result) {
    const cur = view(_cur);
    switch (cur.tag) {
      case 'empty':
        return None;

      case 'singleton':
        result = pfx ? [cur.value, pfx] : [cur.value, Empty];
        break;

      case 'concat':
        pfx = pfx ? new Concat(pfx, cur.lhs) : cur.lhs;
        _cur = cur.rhs;
        break;

      case 'wrap': {
        const [lst, ini] = cur.instance.toVector<A>(cur.values).popLast.get;
        pfx = (
          pfx ? concat_(pfx, fromVector(ini)) : fromVector(ini)
        ) as NonEmpty<A>;
        result = [lst, pfx];
        break;
      }
    }
  }

  return Some(result);
};

export const prepend: <AA>(
  x: AA,
) => <A extends AA>(xs: Chain<A>) => Chain<AA> = x => xs => prepend_(xs, x);

export const cons: <AA>(x: AA) => <A extends AA>(xs: Chain<A>) => Chain<AA> =
  prepend;

export const append: <AA>(x: AA) => <A extends AA>(xs: Chain<A>) => Chain<AA> =
  x => xs =>
    append_(xs, x);

export const snoc: <AA>(x: AA) => <A extends AA>(xs: Chain<A>) => Chain<AA> =
  append;

export const size = <A>(xs: Chain<A>): number => {
  let len = 0;
  for (let i = iterator(xs), x = i.next(); !x.done; x = i.next()) {
    len++;
  }
  return len;
};

export const iterator = <A>(c: Chain<A>): Iterator<A> => {
  let stack: List<Chain<A>> = List(c);
  let cur: Iterator<A> = Iter.empty;

  return Iter.lift(() => {
    iterLoop: while (true) {
      const next = cur.next();
      if (!next.done) return next;

      while (stack.nonEmpty) {
        const [hd, tl] = stack.uncons.get;
        stack = tl;

        const v = view(hd);
        switch (v.tag) {
          case 'empty':
            continue;
          case 'singleton':
            return Iter.Result.pure(v.value);
          case 'wrap':
            cur = v.instance.iterator<A>(v.values);
            continue iterLoop;
          case 'concat':
            stack = stack.prepend(v.rhs).prepend(v.lhs);
            continue;
        }
      }
      return Iter.Result.done;
    }
  });
};

export const reversedIterator = <A>(c: Chain<A>): Iterator<A> => {
  let stack: List<Chain<A>> = List(c);
  let cur: Iterator<A> = Iter.empty;

  return Iter.lift(() => {
    iterLoop: while (true) {
      const next = cur.next();
      if (!next.done) return next;

      while (stack.nonEmpty) {
        const [hd, tl] = stack.uncons.get;
        stack = tl;

        const v = view(hd);
        switch (v.tag) {
          case 'empty':
            continue;
          case 'singleton':
            return Iter.Result.pure(v.value);
          case 'wrap':
            cur = v.instance.toVector<A>(v.values).reverseIterator;
            continue iterLoop;
          case 'concat':
            stack = stack.prepend(v.lhs).prepend(v.rhs);
            continue;
        }
      }
      return Iter.Result.done;
    }
  });
};

export const reverse = <A>(xs: Chain<A>): Chain<A> =>
  fromVector(Vector.fromIterator(reversedIterator(xs)));

export const concat: <AA>(
  y: Chain<AA>,
) => <A extends AA>(x: Chain<A>) => Chain<AA> = y => x => concat_(x, y);

export const deleteFirst: <A>(
  f: (a: A) => boolean,
) => (xs: Chain<A>) => Option<[A, Chain<A>]> = f => xs => deleteFirst_(xs, f);

export const filter: <A>(f: (a: A) => boolean) => (xs: Chain<A>) => Chain<A> =
  f => xs =>
    filter_(xs, f);

export const collect: <A, B>(
  p: (a: A) => Option<B>,
) => (xs: Chain<A>) => Chain<B> = p => xs => collect_(xs, p);

export const collectWhile: <A, B>(
  p: (a: A) => Option<B>,
) => (xs: Chain<A>) => Chain<B> = p => xs => collectWhile_(xs, p);

export const map: <A, B>(f: (a: A) => B) => (xs: Chain<A>) => Chain<B> =
  f => xs =>
    map_(xs, f);

export const flatMap: <A, B>(
  f: (a: A) => Chain<B>,
) => (xs: Chain<A>) => Chain<B> = f => xs => flatMap_(xs, f);

export const coflatMap: <A, B>(
  f: (as: Chain<A>) => B,
) => (xs: Chain<A>) => Chain<B> = f => xs => coflatMap_(xs, f);

export const flatten = <A>(xxs: Chain<Chain<A>>): Chain<A> => flatMap_(xxs, id);

export const align: <B>(
  ys: Chain<B>,
) => <A>(xs: Chain<A>) => Chain<Ior<A, B>> = ys => xs => align_(xs, ys);

export const zip: <B>(ys: Chain<B>) => <A>(xs: Chain<A>) => Chain<[A, B]> =
  ys => xs =>
    zip_(xs, ys);

export const zipWithIndex = <A>(xs: Chain<A>): Chain<[A, number]> =>
  fromVector(Vector.fromIterator(Iter.zipWithIndex(iterator(xs))));

export const zipWith: <A, B, C>(
  ys: Chain<B>,
  f: (a: A, b: B) => C,
) => (xs: Chain<A>) => Chain<C> = (ys, f) => xs => zipWith_(xs, ys)(f);

export const forEach: <A>(f: (a: A) => void) => (xs: Chain<A>) => void =
  f => xs =>
    forEach_(xs, f);

export const foldLeft: <A, B>(
  z: B,
  f: (b: B, a: A) => B,
) => (xs: Chain<A>) => B = (z, f) => xs => foldLeft_(xs, z, f);

export const foldRight: <A, B>(
  z: B,
  f: (a: A, b: B) => B,
) => (xs: Chain<A>) => B = (z, f) => xs => foldRight_(xs, z, f);

export const folding =
  <A>(M: Monoid<A>) =>
  (c: Chain<A>) =>
    foldMap_(M)(c, id);

export const traverse: <G>(
  G: Applicative<G>,
) => <A, B>(
  f: (a: A) => Kind<G, [B]>,
) => (xs: Chain<A>) => Kind<G, [Chain<B>]> = G => f => xs =>
  traverse_(G)(xs, f);

export const toArray = <A>(xs: Chain<A>): A[] => {
  const result = new Array<A>(size(xs));
  let idx = 0;
  forEach_(xs, x => (result[idx++] = x));
  return result;
};

export const toList = <A>(xs: Chain<A>): List<A> =>
  List.fromIterator(iterator(xs));

export const toVector = <A>(xs: Chain<A>): Vector<A> =>
  Vector.fromIterator(iterator(xs));

export const traverseViaChain = <G, F>(
  G: Applicative<G>,
  F: Foldable<F>,
): (<A, B>(
  xs: Kind<F, [A]>,
  f: (a: A, i: number) => Kind<G, [B]>,
) => Kind<G, [Chain<B>]>) =>
  Apply.TraverseStrategy(G)(Rhs => traverseViaChainImpl(G, F, Rhs));

const traverseViaChainImpl =
  <G, F, Rhs>(
    G: Applicative<G>,
    F: Foldable<F>,
    Rhs: TraverseStrategy<G, Rhs>,
  ) =>
  <A, B>(
    xs: Kind<F, [A]>,
    f: (a: A, i: number) => Kind<G, [B]>,
  ): Kind<G, [Chain<B>]> => {
    if (F.isEmpty(xs)) return G.pure(empty);

    // Max width of the tree -- max depth log_128(c.size)
    const width = 128;

    const loop = (
      start: number,
      end: number,
    ): Kind<Rhs, [Kind<G, [Chain<B>]>]> => {
      if (end - start <= width) {
        // We've entered leaves of the tree
        let first = Rhs.toRhs(() =>
          G.map_(f(F.elem_(xs, end - 1).get, end - 1), List),
        );
        for (let idx = end - 2; start <= idx; idx--) {
          const a = F.elem_(xs, idx).get;
          const right = first;
          const idx0 = idx;
          first = Rhs.defer(() => Rhs.map2Rhs(f(a, idx0), right)(List.cons));
        }
        return Rhs.map(first, fromList);
      } else {
        const step = ((end - start) / width) | 0;

        let fchain = Rhs.defer(() => loop(start, start + step));

        for (
          let start0 = start + step, end0 = start0 + step;
          start0 < end;
          start0 += step, end0 += step
        ) {
          const start1 = start0;
          const end1 = Math.min(end, end0);
          const right = Rhs.defer(() => loop(start1, end1));
          fchain = Rhs.map2(fchain, right)(concat_);
        }
        return fchain;
      }
    };

    return Rhs.toG(loop(0, F.size(xs)));
  };

export const traverseFilterViaChain = <G, F>(
  G: Applicative<G>,
  F: Foldable<F>,
): (<A, B>(
  xs: Kind<F, [A]>,
  f: (a: A, i: number) => Kind<G, [Option<B>]>,
) => Kind<G, [Chain<B>]>) =>
  Apply.TraverseStrategy(G)(Rhs => traverseFilterViaChainImpl(G, F, Rhs));

const traverseFilterViaChainImpl =
  <G, F, Rhs>(
    G: Applicative<G>,
    F: Foldable<F>,
    Rhs: TraverseStrategy<G, Rhs>,
  ) =>
  <A, B>(
    xs: Kind<F, [A]>,
    f: (a: A, i: number) => Kind<G, [Option<B>]>,
  ): Kind<G, [Chain<B>]> => {
    if (F.isEmpty(xs)) return G.pure(empty);

    // Max width of the tree -- max depth log_128(c.size)
    const width = 128;

    const loop = (
      start: number,
      end: number,
    ): Kind<Rhs, [Kind<G, [Chain<B>]>]> => {
      if (end - start <= width) {
        // We've entered leaves of the tree
        let first = Rhs.toRhs(() =>
          G.map_(f(F.elem_(xs, end - 1).get, end - 1), opt =>
            opt.nonEmpty ? List(opt.get) : List.empty,
          ),
        );
        for (let idx = end - 2; start <= idx; idx--) {
          const a = F.elem_(xs, idx).get;
          const right = first;
          const idx0 = idx;
          first = Rhs.defer(() =>
            Rhs.map2Rhs(
              f(a, idx0),
              right,
            )((opt, tl) => (opt.nonEmpty ? tl.cons(opt.get) : tl)),
          );
        }
        return Rhs.map(first, fromList);
      } else {
        const step = ((end - start) / width) | 0;

        let fchain = Rhs.defer(() => loop(start, start + step));

        for (
          let start0 = start + step, end0 = start0 + step;
          start0 < end;
          start0 += step, end0 += step
        ) {
          const start1 = start0;
          const end1 = Math.min(end, end0);
          const right = Rhs.defer(() => loop(start1, end1));
          fchain = Rhs.map2(fchain, right)(concat_);
        }
        return fchain;
      }
    };

    return Rhs.toG(loop(0, F.size(xs)));
  };

// -- Point-ful operators

export const prepend_ = <A>(xs: Chain<A>, x: A): Chain<A> =>
  concat_(pure(x), xs);
export const cons_: <A>(xs: Chain<A>, x: A) => Chain<A> = prepend_;

export const append_ = <A>(xs: Chain<A>, x: A): Chain<A> =>
  concat_(xs, pure(x));
export const snoc_: <A>(xs: Chain<A>, x: A) => Chain<A> = append_;

export const concat_ = <A>(x: Chain<A>, y: Chain<A>): Chain<A> => {
  const xx = view(x);
  const yy = view(y);
  if (xx.tag === 'empty') return yy;
  if (yy.tag === 'empty') return xx;
  return new Concat(xx, yy);
};

export const deleteFirst_ = <A>(
  xs: Chain<A>,
  f: (a: A) => boolean,
): Option<[A, Chain<A>]> => {
  let acc: Chain<A> = empty;
  let rem: Chain<A> = xs;
  let cur: A;

  while (nonEmpty(rem)) {
    [cur, rem] = uncons(rem).get;
    if (f(cur)) return Some([cur, concat_(acc, rem)]);
    acc = append_(acc, cur);
  }

  return None;
};

export const filter_ = <A>(xs: Chain<A>, p: (a: A) => boolean): Chain<A> =>
  collect_(xs, x => (p(x) ? Some(x) : None));

export const collect_ = <A, B>(
  xs: Chain<A>,
  f: (a: A) => Option<B>,
): Chain<B> =>
  foldLeft_(xs, empty as Chain<B>, (ys, x) =>
    f(x).fold(
      () => ys,
      y => append_(ys, y),
    ),
  );

export const collectWhile_ = <A, B>(
  xs: Chain<A>,
  f: (a: A) => Option<B>,
): Chain<B> => {
  let results: Chain<B> = empty;
  _forEachUntil(xs, x => {
    const next = f(x);
    if (next.isEmpty) return false;
    results = append_(results, next.get);
    return true;
  });
  return results;
};

export const map_ = <A, B>(xs: Chain<A>, f: (a: A) => B): Chain<B> =>
  fromVector(pipe(iterator(xs), Iter.map(f), Vector.fromIterator));

export const flatMap_ = <A, B>(
  xs: Chain<A>,
  f: (a: A) => Chain<B>,
): Chain<B> => {
  let result: Chain<B> = empty;
  const iter = iterator(xs);
  for (let next = iter.next(); !next.done; next = iter.next())
    result = concat_(result, f(next.value));
  return result;
};

export const coflatMap_ = <A, B>(
  xs: Chain<A>,
  f: (as: Chain<A>) => B,
): Chain<B> => {
  const buf: B[] = [];
  while (nonEmpty(xs)) {
    buf.push(f(xs));
    xs = tail(xs);
  }
  return fromArray(buf);
};

export const align_ = <A, B>(xs: Chain<A>, ys: Chain<B>): Chain<Ior<A, B>> => {
  let result: Chain<Ior<A, B>> = empty;
  const xIt = iterator(xs);
  const yIt = iterator(ys);
  for (
    let xr = xIt.next(), yr = yIt.next();
    !xr.done || !yr.done;
    xr = xIt.next(), yr = yIt.next()
  ) {
    // prettier-ignore
    const ior = 
      !xr.done && !yr.done ? Ior.Both(xr.value, yr.value)
      : !xr.done           ? Ior.Left(xr.value)
      :                      Ior.Right(yr.value!);

    result = append_(result, ior);
  }
  return result;
};

export const zip_ = <A, B>(xs: Chain<A>, ys: Chain<B>): Chain<[A, B]> =>
  zipWith_(xs, ys)(tupled);

export const zipWith_ =
  <A, B>(xs: Chain<A>, ys: Chain<B>) =>
  <C>(f: (a: A, b: B) => C): Chain<C> =>
    fromVector(
      Vector.fromIterator(Iter.zipWith_(iterator(xs), iterator(ys))(f)),
    );

export const forEach_ = <A>(xs: Chain<A>, f: (a: A) => void): void => {
  const it = iterator(xs);
  let next = it.next();
  while (!next.done) {
    f(next.value);
    next = it.next();
  }
};

export const foldLeft_ = <A, B>(c: Chain<A>, z: B, f: (b: B, a: A) => B): B => {
  const it = iterator(c);
  let acc = z;
  for (let next: IteratorResult<A> = it.next(); !next.done; next = it.next())
    acc = f(acc, next.value);

  return acc;
};

export const foldRight_ = <A, B>(
  c: Chain<A>,
  z: B,
  f: (a: A, b: B) => B,
): B => {
  const it = reversedIterator(c);
  let acc = z;
  for (let next: IteratorResult<A> = it.next(); !next.done; next = it.next()) {
    acc = f(next.value, acc);
  }
  return acc;
};

export const foldMap_ =
  <M>(M: Monoid<M>) =>
  <A>(c: Chain<A>, f: (a: A) => M): M =>
    foldLeft_(c, M.empty, (a, b) => M.combine_(a, () => f(b)));

export const traverse_ =
  <G>(G: Applicative<G>) =>
  <A, B>(xs: Chain<A>, f: (a: A) => Kind<G, [B]>): Kind<G, [Chain<B>]> =>
    traverseViaChain(G, CatsArray.FoldableWithIndex())(toArray(xs), x => f(x));

export const traverseFilter_ =
  <G>(G: Applicative<G>) =>
  <A, B>(
    xs: Chain<A>,
    f: (a: A) => Kind<G, [Option<B>]>,
  ): Kind<G, [Chain<B>]> =>
    traverseFilterViaChain(G, CatsArray.FoldableWithIndex())(toArray(xs), x =>
      f(x),
    );

export const equals_ =
  <A>(E: Eq<A>) =>
  (xs: Chain<A>, ys: Chain<A>): boolean => {
    const xsIt = iterator(xs);
    const ysIt = iterator(ys);

    for (
      let x = xsIt.next(), y = ysIt.next();
      !x.done || !y.done;
      x = xsIt.next(), y = ysIt.next()
    ) {
      if (x.done || y.done) return false;
      if (E.notEquals(x.value, y.value)) return false;
    }
    return true;
  };

const _forEachUntil = <A>(xs: Chain<A>, f: (a: A) => boolean): void => {
  let stack: List<Chain<A>> = List(xs);

  while (stack.nonEmpty) {
    const next = view(stack.head);
    stack = stack.tail;

    switch (next.tag) {
      case 'empty':
        break;

      case 'singleton': {
        const cont = f(next.value);
        if (!cont) return;
        break;
      }

      case 'concat':
        stack = stack.prepend(next.rhs).prepend(next.lhs);
        break;

      case 'wrap': {
        const it = next.instance.iterator<A>(next.values);
        for (let nextRes = it.next(); !nextRes.done; nextRes = it.next()) {
          if (f(nextRes.value)) {
            return;
          }
        }
        break;
      }
    }
  }
};
