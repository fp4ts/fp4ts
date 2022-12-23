// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, flip, Kind, throwError, tupled } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { MonoidK } from '../../../monoid-k';
import { Applicative } from '../../../applicative';

import { Ior } from '../../ior';
import { Option, Some, None } from '../../option';
import { Either } from '../../either';
import { Iter } from '../iterator';
import { List } from '../list';
import { Chain } from '../chain';

import { Vector, Vector0, View as VectorView } from './algebra';
import { arrIterator, ioob, reverseArrIterator } from './helpers';
import { VectorBuilder } from './vector-builder';
import { pure } from './constructors';
import { vectorFoldable } from './instances';
import { View } from '../view';

export const isEmpty = <A>(xs: Vector<A>): boolean => xs === Vector0;
export const nonEmpty = <A>(xs: Vector<A>): boolean => xs !== Vector0;

export const head = <A>(xs: Vector<A>): A => elem_(xs, 0);
export const headOption = <A>(xs: Vector<A>): Option<A> => xs.elemOption(0);
export const tail = <A>(xs: Vector<A>): Vector<A> => xs.slice(1, xs.size);

export const last = <A>(xs: Vector<A>): A => elem_(xs, xs.size - 1);
export const lastOption = <A>(xs: Vector<A>): Option<A> =>
  xs.elemOption(xs.size - 1);
export const init = <A>(xs: Vector<A>): Vector<A> => xs.slice(0, xs.size - 1);

export const popHead = <A>(xs: Vector<A>): Option<[A, Vector<A>]> =>
  headOption(xs).map(h => [h, tail(xs)]);

export const popLast = <A>(xs: Vector<A>): Option<[A, Vector<A>]> =>
  lastOption(xs).map(l => [l, init(xs)]);

export const view = <A>(xs: Vector<A>): View<A> => View.fromVector(xs);

export function* iterator<A>(v: Vector<A>): Generator<A> {
  const vv = v as VectorView<A>;
  switch (vv.tag) {
    case 0:
      return;
    case 1:
      yield* arrIterator(1, vv.data1);
      return;
    case 2:
      yield* arrIterator(1, vv.prefix1);
      yield* arrIterator(2, vv.data2);
      yield* arrIterator(1, vv.suffix1);
      return;
    case 3:
      yield* arrIterator(1, vv.prefix1);
      yield* arrIterator(2, vv.prefix2);
      yield* arrIterator(3, vv.data3);
      yield* arrIterator(2, vv.suffix2);
      yield* arrIterator(1, vv.suffix1);
      return;
    case 4:
      yield* arrIterator(1, vv.prefix1);
      yield* arrIterator(2, vv.prefix2);
      yield* arrIterator(3, vv.prefix3);
      yield* arrIterator(4, vv.data4);
      yield* arrIterator(3, vv.suffix3);
      yield* arrIterator(2, vv.suffix2);
      yield* arrIterator(1, vv.suffix1);
      return;
    case 5:
      yield* arrIterator(1, vv.prefix1);
      yield* arrIterator(2, vv.prefix2);
      yield* arrIterator(3, vv.prefix3);
      yield* arrIterator(4, vv.prefix4);
      yield* arrIterator(5, vv.data5);
      yield* arrIterator(4, vv.suffix4);
      yield* arrIterator(3, vv.suffix3);
      yield* arrIterator(2, vv.suffix2);
      yield* arrIterator(1, vv.suffix1);
      return;
    case 6:
      yield* arrIterator(1, vv.prefix1);
      yield* arrIterator(2, vv.prefix2);
      yield* arrIterator(3, vv.prefix3);
      yield* arrIterator(4, vv.prefix4);
      yield* arrIterator(5, vv.prefix5);
      yield* arrIterator(6, vv.data6);
      yield* arrIterator(5, vv.suffix5);
      yield* arrIterator(4, vv.suffix4);
      yield* arrIterator(3, vv.suffix3);
      yield* arrIterator(2, vv.suffix2);
      yield* arrIterator(1, vv.suffix1);
      return;
  }
}

export function* reverseIterator<A>(v: Vector<A>): Generator<A> {
  const vv = v as VectorView<A>;
  switch (vv.tag) {
    case 0:
      return;
    case 1:
      yield* reverseArrIterator(1, vv.data1);
      return;
    case 2:
      yield* reverseArrIterator(1, vv.suffix1);
      yield* reverseArrIterator(2, vv.data2);
      yield* reverseArrIterator(1, vv.prefix1);
      return;
    case 3:
      yield* reverseArrIterator(1, vv.suffix1);
      yield* reverseArrIterator(2, vv.suffix2);
      yield* reverseArrIterator(3, vv.data3);
      yield* reverseArrIterator(2, vv.prefix2);
      yield* reverseArrIterator(1, vv.prefix1);
      return;
    case 4:
      yield* reverseArrIterator(1, vv.suffix1);
      yield* reverseArrIterator(2, vv.suffix2);
      yield* reverseArrIterator(3, vv.suffix3);
      yield* reverseArrIterator(4, vv.data4);
      yield* reverseArrIterator(3, vv.prefix3);
      yield* reverseArrIterator(2, vv.prefix2);
      yield* reverseArrIterator(1, vv.prefix1);
      return;
    case 5:
      yield* reverseArrIterator(1, vv.suffix1);
      yield* reverseArrIterator(2, vv.suffix2);
      yield* reverseArrIterator(3, vv.suffix3);
      yield* reverseArrIterator(4, vv.suffix4);
      yield* reverseArrIterator(5, vv.data5);
      yield* reverseArrIterator(4, vv.prefix4);
      yield* reverseArrIterator(3, vv.prefix3);
      yield* reverseArrIterator(2, vv.prefix2);
      yield* reverseArrIterator(1, vv.prefix1);
      return;
    case 6:
      yield* reverseArrIterator(1, vv.suffix1);
      yield* reverseArrIterator(2, vv.suffix2);
      yield* reverseArrIterator(3, vv.suffix3);
      yield* reverseArrIterator(4, vv.suffix4);
      yield* reverseArrIterator(5, vv.suffix5);
      yield* reverseArrIterator(6, vv.data6);
      yield* reverseArrIterator(5, vv.prefix5);
      yield* reverseArrIterator(4, vv.prefix4);
      yield* reverseArrIterator(3, vv.prefix3);
      yield* reverseArrIterator(2, vv.prefix2);
      yield* reverseArrIterator(1, vv.prefix1);
      return;
  }
}

export const reverse = <A>(xs: Vector<A>): Vector<A> =>
  new VectorBuilder<A>().addIterator(reverseIterator(xs)).toVector;

export const toArray = <A>(xs: Vector<A>): A[] => {
  const res = new Array<A>(xs.size);
  const iter = iterator(xs);
  for (let i = iter.next(), idx = 0; !i.done; i = iter.next(), idx++) {
    res[idx] = i.value;
  }
  return res;
};

export const toList = <A>(xs: Vector<A>): List<A> => {
  let r: List<A> = List.empty;
  const it = reverseIterator(xs);
  for (let i = it.next(); !i.done; i = it.next()) {
    r = r.prepend(i.value);
  }
  return r;
};

export const zipWithIndex = <A>(xs: Vector<A>): Vector<[A, number]> => {
  let idx = 0;
  return xs.map(x => [x, idx++]);
};

// -- Point-ful operators

export const all_ = <A>(xs: Vector<A>, p: (a: A) => boolean): boolean =>
  Iter.all_(iterator(xs), p);

export const any_ = <A>(xs: Vector<A>, p: (a: A) => boolean): boolean =>
  Iter.any_(iterator(xs), p);

export const count_ = <A>(xs: Vector<A>, p: (a: A) => boolean): number =>
  Iter.count_(iterator(xs), p);

export const take_ = <A>(xs: Vector<A>, n: number): Vector<A> => xs.slice(0, n);
export const takeRight_ = <A>(xs: Vector<A>, n: number): Vector<A> =>
  xs.slice(xs.size - Math.max(n, 0), xs.size);

export const drop_ = <A>(xs: Vector<A>, n: number): Vector<A> =>
  xs.slice(n, xs.size);

export const dropRight_ = <A>(xs: Vector<A>, n: number): Vector<A> =>
  xs.slice(0, xs.size - Math.max(n, 0));

export const splitAt_ = <A>(
  xs: Vector<A>,
  idx: number,
): [Vector<A>, Vector<A>] => [take_(xs, idx), drop_(xs, idx)];

export const elem_ = <A>(xs: Vector<A>, idx: number): A =>
  xs.elemOption(idx).getOrElse(() => ioob(idx));

export const lookup_ = <K, V>(
  E: Eq<K>,
  xs: Vector<[K, V]>,
  k: K,
): Option<V> => {
  for (const kv of iterator(xs)) {
    if (E.equals(kv[0], k)) return Some(kv[1]);
  }
  return None;
};

export const filter_ = <A>(xs: Vector<A>, p: (a: A) => boolean): Vector<A> => {
  const iter = Iter.filter_(iterator(xs), p);
  return new VectorBuilder<A>().addIterator(iter).toVector;
};

export const collect_ = <A, B>(
  xs: Vector<A>,
  f: (a: A) => Option<B>,
): Vector<B> => {
  const iter = Iter.collect_(iterator(xs), f);
  return new VectorBuilder<B>().addIterator(iter).toVector;
};

export const collectWhile_ = <A, B>(
  xs: Vector<A>,
  f: (a: A) => Option<B>,
): Vector<B> => {
  const iter = Iter.collectWhile_(iterator(xs), f);
  return new VectorBuilder<B>().addIterator(iter).toVector;
};

export const flatMap_ = <A, B>(
  xs: Vector<A>,
  f: (a: A) => Vector<B>,
): Vector<B> => {
  const b = new VectorBuilder<B>();
  forEach_(xs, x => b.addVector(f(x)));
  return b.toVector;
};

export const coflatMap_ = <A, B>(
  xs: Vector<A>,
  f: (a: Vector<A>) => B,
): Vector<B> => {
  const b = new VectorBuilder<B>();

  while (xs !== Vector0) {
    b.addOne(f(xs));
    xs = tail(xs);
  }

  return b.toVector;
};

export const forEach_ = <A>(xs: Vector<A>, f: (a: A) => void): void =>
  Iter.forEach_(iterator(xs), f);

export const foldLeft_ = <A, B>(xs: Vector<A>, z: B, f: (b: B, a: A) => B): B =>
  Iter.foldLeft_(iterator(xs), z, f);

export const foldLeft1_ = <A>(xs: Vector<A>, f: (b: A, a: A) => A): A =>
  popHead(xs)
    .map(([hd, tl]) => foldLeft_(tl, hd, f))
    .getOrElse(() => throwError(new Error('Vector0.foldLeft1')));

export const foldRight_ = <A, B>(
  xs: Vector<A>,
  ez: Eval<B>,
  f: (a: A, eb: Eval<B>) => Eval<B>,
): Eval<B> => Iter.foldRight_(iterator(xs), ez, f);

export const foldRight1_ = <A>(
  xs: Vector<A>,
  f: (a: A, eb: Eval<A>) => Eval<A>,
): Eval<A> => {
  const size = xs.size;
  const last = size - 1;
  const go = (idx: number): Eval<A> =>
    idx >= size
      ? Eval.later(() => throwError(new Error('Vector0.foldRight1')))
      : idx === last
      ? Eval.later(() => elem_(xs, last))
      : f(
          elem_(xs, idx),
          Eval.defer(() => go(idx + 1)),
        );
  return Eval.defer(() => go(0));
};

export const foldRightStrict_ = <A, B>(
  xs: Vector<A>,
  z: B,
  f: (a: A, b: B) => B,
): B => Iter.foldLeft_(reverseIterator(xs), z, flip(f));

export const foldRight1Strict_ = <A>(xs: Vector<A>, f: (a: A, b: A) => A): A =>
  popLast(xs)
    .map(([l, ini]) => foldRightStrict_(ini, l, f))
    .getOrElse(() => throwError(new Error('Vector0.foldRight1_')));

export const foldMap_ =
  <M>(M: Monoid<M>) =>
  <A>(xs: Vector<A>, f: (a: A) => M): M =>
    Iter.foldMap_(M, iterator(xs), f);

export const foldMapK_ =
  <F>(F: MonoidK<F>) =>
  <A, B>(xs: Vector<A>, f: (a: A) => Kind<F, [B]>): Kind<F, [B]> =>
    Iter.foldMap_(F.algebra<B>(), iterator(xs), f);

export const align_ = <A, B>(xs: Vector<A>, ys: Vector<B>): Vector<Ior<A, B>> =>
  zipAllWith_(
    xs.map(Some),
    ys.map(Some),
    () => None,
    () => None,
  )((l, r) => Ior.fromOptions(l, r).get);

export const zip_ = <A, B>(xs: Vector<A>, ys: Vector<B>): Vector<[A, B]> =>
  zipWith_(xs, ys)(tupled);

export const zipWith_ =
  <A, B>(xs: Vector<A>, ys: Vector<B>) =>
  <C>(f: (a: A, b: B) => C): Vector<C> => {
    const iter = Iter.zipWith_(iterator(xs), iterator(ys))(f);
    return new VectorBuilder<C>().addIterator(iter).toVector;
  };

export const zipAll_ = <A, B>(
  xs: Vector<A>,
  ys: Vector<B>,
  defaultX: () => A,
  defaultY: () => B,
): Vector<[A, B]> => zipAllWith_(xs, ys, defaultX, defaultY)(tupled);

export const zipAllWith_ =
  <A, B>(xs: Vector<A>, ys: Vector<B>, defaultX: () => A, defaultY: () => B) =>
  <C>(f: (a: A, b: B) => C): Vector<C> => {
    const b = new VectorBuilder<C>();
    const iter = Iter.zipAllWith_(
      iterator(xs),
      iterator(ys),
      defaultX,
      defaultY,
    )(f);
    return b.addIterator(iter).toVector;
  };

export const partition_ = <A>(
  xs: Vector<A>,
  p: (a: A) => boolean,
): [Vector<A>, Vector<A>] => {
  const l = new VectorBuilder<A>();
  const r = new VectorBuilder<A>();

  forEach_(xs, x => {
    if (p(x)) {
      l.addOne(x);
    } else {
      r.addOne(x);
    }
  });

  return [l.toVector, r.toVector];
};

export const partitionWith_ = <A, L, R>(
  xs: Vector<A>,
  f: (a: A) => Either<L, R>,
): [Vector<L>, Vector<R>] => {
  const l = new VectorBuilder<L>();
  const r = new VectorBuilder<R>();

  forEach_(xs, x => {
    const ea = f(x);
    if (ea.isLeft) {
      l.addOne(ea.getLeft);
    } else {
      r.addOne(ea.get);
    }
  });

  return [l.toVector, r.toVector];
};

export const scanLeft_ = <A, B>(
  xs: Vector<A>,
  z: B,
  f: (b: B, a: A) => B,
): Vector<B> => {
  const r = new VectorBuilder<B>().addOne(z);
  Iter.forEach_(iterator(xs), x => {
    z = f(z, x);
    r.addOne(z);
  });
  return r.toVector;
};

export const scanLeft1_ = <A>(xs: Vector<A>, f: (b: A, a: A) => A): Vector<A> =>
  popHead(xs)
    .map(([h, t]) => scanLeft_(t, h, f))
    .getOrElse(() => throwError(new Error('Vector0.scanLeft1')));

export const scanRight_ = <A, B>(
  xs: Vector<A>,
  z: B,
  f: (a: A, b: B) => B,
): Vector<B> => {
  let r: Vector<B> = pure(z);
  Iter.forEach_(reverseIterator(xs), x => {
    z = f(x, z);
    r = r.prepend(z);
  });
  return r;
};

export const scanRight1_ = <A>(
  xs: Vector<A>,
  f: (a: A, b: A) => A,
): Vector<A> =>
  popLast(xs)
    .map(([l, i]) => scanRight_(i, l, f))
    .getOrElse(() => throwError(new Error('Vector0.scanRight1')));

export const traverse_ =
  <F>(F: Applicative<F>) =>
  <A, B>(xs: Vector<A>, f: (a: A) => Kind<F, [B]>): Kind<F, [Vector<B>]> =>
    F.map_(
      Chain.traverseViaChain(F, vectorFoldable())(xs, x => f(x)),
      ys => ys.toVector,
    );

export const traverseFilter_ =
  <F>(F: Applicative<F>) =>
  <A, B>(
    xs: Vector<A>,
    f: (a: A) => Kind<F, [Option<B>]>,
  ): Kind<F, [Vector<B>]> =>
    F.map_(
      Chain.traverseFilterViaChain(F, vectorFoldable())(xs, x => f(x)),
      ys => ys.toVector,
    );

export const equals_ =
  <A>(E: Eq<A>) =>
  (xs: Vector<A>, ys: Vector<A>): boolean => {
    if (xs.size !== ys.size) return false;
    const itl = iterator(xs);
    const itr = iterator(ys);
    for (
      let l = itl.next(), r = itr.next();
      !l.done && !r.done;
      l = itl.next(), r = itr.next()
    ) {
      if (E.notEquals(l.value, r.value)) return false;
    }
    return true;
  };
