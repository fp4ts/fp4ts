// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Eq, Monoid, Ord } from '@fp4ts/cats-kernel';
import { Applicative } from '../../../applicative';
import { Show } from '../../../show';
import { MonoidK } from '../../../monoid-k';

import { Ior } from '../../ior';
import { Option } from '../../option';
import { Either } from '../../either';
import { Vector } from '../vector';
import { NonEmptyList } from '../non-empty-list';

import { List } from './algebra';
import {
  all_,
  any_,
  collectWhile_,
  collect_,
  concat_,
  count_,
  dropRight_,
  drop_,
  elemOption_,
  elem_,
  equals_,
  filter_,
  flatMap_,
  flatten,
  flatTraverse_,
  foldLeft1_,
  foldLeft_,
  foldMapK_,
  foldMap_,
  foldRight1_,
  foldRight_,
  fold_,
  head,
  headOption,
  init,
  isEmpty,
  last,
  lastOption,
  map_,
  nonEmpty,
  notEquals_,
  partition_,
  prepend_,
  reverse,
  scanLeft1_,
  scanLeft_,
  scanRight1_,
  scanRight_,
  show_,
  size,
  slice_,
  splitAt_,
  tail,
  takeRight_,
  take_,
  toArray,
  toVector,
  traverse_,
  uncons,
  zipAll_,
  zipWithIndex,
  zipAllWith_,
  zipWith_,
  zip_,
  align_,
  iterator,
  reverseIterator,
  append_,
  forEach_,
  popLast,
  coflatMap_,
  toNel,
  sort_,
} from './operators';

declare module './algebra' {
  interface List<out A> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    readonly size: number;

    readonly head: A;
    readonly headOption: Option<A>;
    readonly tail: List<A>;

    readonly last: A;
    readonly lastOption: Option<A>;
    readonly init: List<A>;

    readonly popHead: Option<[A, List<A>]>;
    readonly uncons: Option<[A, List<A>]>;
    readonly popLast: Option<[A, List<A>]>;

    readonly toArray: A[];
    readonly toList: List<A>;
    readonly toVector: Vector<A>;
    readonly toNel: Option<NonEmptyList<A>>;

    readonly iterator: Iterator<A>;
    readonly reverseIterator: Iterator<A>;
    [Symbol.iterator](): Iterator<A>;

    readonly reverse: List<A>;

    equals<B>(this: List<B>, E: Eq<B>, that: List<B>): boolean;
    notEquals<B>(this: List<B>, E: Eq<B>, that: List<B>): boolean;

    prepend<B>(this: List<B>, x: B): List<B>;
    cons<B>(this: List<B>, x: B): List<B>;
    '+::'<B>(this: List<B>, x: B): List<B>;

    append<B>(this: List<B>, x: B): List<B>;
    snoc<B>(this: List<B>, x: B): List<B>;
    '::+'<B>(this: List<B>, x: B): List<B>;

    concat<B>(this: List<B>, xs: List<B>): List<B>;
    '+++'<B>(this: List<B>, xs: List<B>): List<B>;

    elem(idx: number): A;
    '!!'(idx: number): A;

    elemOption(idx: number): Option<A>;
    '!?'(idx: number): Option<A>;

    all(p: (a: A) => boolean): boolean;
    any(p: (a: A) => boolean): boolean;
    count(p: (a: A) => boolean): number;

    take(n: number): List<A>;
    takeRight(n: number): List<A>;

    drop(n: number): List<A>;
    dropRight(n: number): List<A>;

    slice(from: number, until: number): List<A>;
    splitAt(idx: number): [List<A>, List<A>];

    filter: (p: (a: A) => boolean) => List<A>;
    collect: <B>(f: (a: A) => Option<B>) => List<B>;
    collectWhile: <B>(f: (a: A) => Option<B>) => List<B>;
    map: <B>(f: (a: A) => B) => List<B>;

    flatMap<B>(f: (a: A) => List<B>): List<B>;
    coflatMap<B>(f: (aa: List<A>) => B): List<B>;

    readonly flatten: A extends List<infer B> ? List<B> : never;

    align<B>(ys: List<B>): List<Ior<A, B>>;
    zip<B>(ys: List<B>): List<[A, B]>;
    zipWith<B, C>(ys: List<B>, f: (a: A, b: B) => C): List<C>;

    readonly zipWithIndex: List<[A, number]>;

    zipAll<AA, B>(
      this: List<AA>,
      ys: List<B>,
      defaultL: () => AA,
      defaultR: () => B,
    ): List<[AA, B]>;

    zipAllWith<AA, B, C>(
      this: List<AA>,
      ys: List<B>,
      defaultL: () => AA,
      defaultR: () => B,
      f: (a: AA, b: B) => C,
    ): List<C>;

    forEach(f: (a: A) => void): void;

    partition<L, R>(f: (a: A) => Either<L, R>): [List<L>, List<R>];

    fold: <B1, B2 = B1>(
      onNil: () => B1,
      onCons: (head: A, tail: List<A>) => B2,
    ) => B1 | B2;

    foldLeft<B>(z: B, f: (b: B, a: A) => B): B;
    foldLeft1<B>(this: List<B>, f: (x: B, a: B) => B): B;
    foldRight<B>(z: B, f: (a: A, b: B) => B): B;
    foldRight1<B>(this: List<B>, f: (x: B, a: B) => B): B;

    foldMap<M>(M: Monoid<M>): (f: (a: A) => M) => M;
    foldMapK<F>(F: MonoidK<F>): <B>(f: (a: A) => Kind<F, [B]>) => Kind<F, [B]>;

    scanLeft<B>(z: B, f: (b: B, a: A) => B): List<B>;
    scanLeft1<B>(this: List<B>, f: (x: B, y: B) => B): List<B>;
    scanRight<B>(z: B, f: (a: A, b: B) => B): List<B>;
    scanRight1<B>(this: List<B>, f: (x: B, y: B) => B): List<B>;

    traverse<G>(
      G: Applicative<G>,
    ): <B>(f: (a: A) => Kind<G, [B]>) => Kind<G, [List<B>]>;

    flatTraverse: <G>(
      G: Applicative<G>,
    ) => <B>(f: (a: A) => Kind<G, [List<B>]>) => Kind<G, [List<B>]>;

    show<B>(this: List<B>, S?: Show<B>): string;
    sort<B>(this: List<B>, O: Ord<B>): List<B>;
  }
}

Object.defineProperty(List.prototype, 'head', {
  get<A>(this: List<A>): A {
    return head(this);
  },
});

Object.defineProperty(List.prototype, 'headOption', {
  get<A>(this: List<A>): Option<A> {
    return headOption(this);
  },
});

Object.defineProperty(List.prototype, 'tail', {
  get<A>(this: List<A>): List<A> {
    return tail(this);
  },
});

Object.defineProperty(List.prototype, 'init', {
  get<A>(this: List<A>): List<A> {
    return init(this);
  },
});

Object.defineProperty(List.prototype, 'last', {
  get<A>(this: List<A>): A {
    return last(this);
  },
});

Object.defineProperty(List.prototype, 'lastOption', {
  get<A>(this: List<A>): Option<A> {
    return lastOption(this);
  },
});

Object.defineProperty(List.prototype, 'popHead', {
  get<A>(this: List<A>): Option<[A, List<A>]> {
    return uncons(this);
  },
});
Object.defineProperty(List.prototype, 'uncons', {
  get<A>(this: List<A>): Option<[A, List<A>]> {
    return uncons(this);
  },
});

Object.defineProperty(List.prototype, 'popLast', {
  get<A>(this: List<A>): Option<[A, List<A>]> {
    return popLast(this);
  },
});

Object.defineProperty(List.prototype, 'isEmpty', {
  get<A>(this: List<A>): boolean {
    return isEmpty(this);
  },
});

Object.defineProperty(List.prototype, 'nonEmpty', {
  get<A>(this: List<A>): boolean {
    return nonEmpty(this);
  },
});

Object.defineProperty(List.prototype, 'size', {
  get<A>(this: List<A>): unknown {
    return size(this);
  },
});

Object.defineProperty(List.prototype, 'toArray', {
  get<A>(this: List<A>): A[] {
    return toArray(this);
  },
});

Object.defineProperty(List.prototype, 'toList', {
  get<A>(this: List<A>): List<A> {
    return this;
  },
});

Object.defineProperty(List.prototype, 'toVector', {
  get<A>(this: List<A>): Vector<A> {
    return toVector(this);
  },
});

Object.defineProperty(List.prototype, 'toNel', {
  get() {
    return toNel(this);
  },
});

Object.defineProperty(List.prototype, 'iterator', {
  get<A>(this: List<A>): Iterator<A> {
    return iterator(this);
  },
});

Object.defineProperty(List.prototype, 'reverseIterator', {
  get<A>(this: List<A>): Iterator<A> {
    return reverseIterator(this);
  },
});

List.prototype[Symbol.iterator] = function () {
  return iterator(this);
};

Object.defineProperty(List.prototype, 'reverse', {
  get<A>(this: List<A>): List<A> {
    return reverse(this);
  },
});

List.prototype.equals = function <A>(
  this: List<A>,
  E: Eq<A>,
  that: List<A>,
): boolean {
  return equals_(E, this, that);
};

List.prototype.notEquals = function <A>(
  this: List<A>,
  E: Eq<A>,
  that: List<A>,
): boolean {
  return notEquals_(E, this, that);
};

List.prototype.prepend = function <A>(this: List<A>, x: A): List<A> {
  return prepend_(this, x);
};
List.prototype.cons = List.prototype.prepend;
List.prototype['+::'] = List.prototype.prepend;

List.prototype.append = function <A>(this: List<A>, x: A): List<A> {
  return append_(this, x);
};
List.prototype.snoc = List.prototype.append;
List.prototype['::+'] = List.prototype.append;

List.prototype.concat = function (this, that) {
  return concat_(this, that);
};
List.prototype['+++'] = List.prototype.concat;

List.prototype.elem = function <A>(this: List<A>, idx: number): A {
  return elem_(this, idx);
};
List.prototype['!!'] = List.prototype.elem;

List.prototype.elemOption = function <A>(
  this: List<A>,
  idx: number,
): Option<A> {
  return elemOption_(this, idx);
};
List.prototype['!?'] = List.prototype.elemOption;

List.prototype.all = function <A>(
  this: List<A>,
  p: (a: A) => boolean,
): boolean {
  return all_(this, p);
};

List.prototype.any = function <A>(
  this: List<A>,
  p: (a: A) => boolean,
): boolean {
  return any_(this, p);
};

List.prototype.count = function <A>(
  this: List<A>,
  p: (a: A) => boolean,
): number {
  return count_(this, p);
};

List.prototype.take = function <A>(this: List<A>, n: number): List<A> {
  return take_(this, n);
};

List.prototype.takeRight = function <A>(this: List<A>, n: number): List<A> {
  return takeRight_(this, n);
};

List.prototype.drop = function <A>(this: List<A>, n: number): List<A> {
  return drop_(this, n);
};

List.prototype.dropRight = function <A>(this: List<A>, n: number): List<A> {
  return dropRight_(this, n);
};

List.prototype.slice = function <A>(
  this: List<A>,
  from: number,
  until: number,
): List<A> {
  return slice_(this, from, until);
};

List.prototype.splitAt = function <A>(
  this: List<A>,
  idx: number,
): [List<A>, List<A>] {
  return splitAt_(this, idx);
};

List.prototype.filter = function <A>(
  this: List<A>,
  p: (a: A) => boolean,
): List<A> {
  return filter_(this, p);
};

List.prototype.map = function <A, B>(this: List<A>, f: (a: A) => B): List<B> {
  return map_(this, f);
};

List.prototype.flatMap = function <A, B>(
  this: List<A>,
  f: (a: A) => List<B>,
): List<B> {
  return flatMap_(this, f);
};

List.prototype.coflatMap = function (f) {
  return coflatMap_(this, f);
};

Object.defineProperty(List.prototype, 'flatten', {
  get<A>(this: List<List<A>>): List<A> {
    return flatten(this);
  },
});

List.prototype.fold = function (onNil, onCons) {
  return fold_(this, onNil, onCons);
};

List.prototype.foldLeft = function <A, B>(
  this: List<A>,
  z: B,
  f: (b: B, a: A) => B,
): B {
  return foldLeft_(this, z, f);
};

List.prototype.foldLeft1 = function <A>(
  this: List<A>,
  f: (x: A, y: A) => A,
): A {
  return foldLeft1_(this, f);
};

List.prototype.foldRight = function <A, B>(
  this: List<A>,
  z: B,
  f: (a: A, b: B) => B,
): B {
  return foldRight_(this, z, f);
};

List.prototype.foldRight1 = function <A>(
  this: List<A>,
  f: (x: A, y: A) => A,
): A {
  return foldRight1_(this, f);
};

List.prototype.foldMap = function <A, M>(
  this: List<A>,
  M: Monoid<M>,
): (f: (a: A) => M) => M {
  return f => foldMap_(M)(this, f);
};

List.prototype.foldMapK = function <F, A>(
  this: List<A>,
  F: MonoidK<F>,
): <B>(f: (a: A) => Kind<F, [B]>) => Kind<F, [B]> {
  return f => foldMapK_(F)(this, f);
};

List.prototype.align = function (that) {
  return align_(this, that);
};

List.prototype.zip = function (that) {
  return zip_(this, that);
};

List.prototype.zipWith = function (that, f) {
  return zipWith_(this, that, f);
};

Object.defineProperty(List.prototype, 'zipWithIndex', {
  get<A>(this: List<A>): List<[A, number]> {
    return zipWithIndex(this);
  },
});

List.prototype.zipAll = function (that, defaultL, defaultR) {
  return zipAll_(this, that, defaultL, defaultR);
};

List.prototype.zipAllWith = function (that, defaultL, defaultR, f) {
  return zipAllWith_(this, that, defaultL, defaultR, f);
};

List.prototype.collect = function <A, B>(
  this: List<A>,
  f: (a: A) => Option<B>,
): List<B> {
  return collect_(this, f);
};

List.prototype.forEach = function (f) {
  return forEach_(this, f);
};

List.prototype.collectWhile = function <A, B>(
  this: List<A>,
  f: (a: A) => Option<B>,
): List<B> {
  return collectWhile_(this, f);
};

List.prototype.partition = function <A, L, R>(
  this: List<A>,
  f: (a: A) => Either<L, R>,
): [List<L>, List<R>] {
  return partition_(this, f);
};

List.prototype.scanLeft = function <A, B>(
  this: List<A>,
  z: B,
  f: (b: B, a: A) => B,
): List<B> {
  return scanLeft_(this, z, f);
};

List.prototype.scanLeft1 = function <A>(
  this: List<A>,
  f: (x: A, y: A) => A,
): List<A> {
  return scanLeft1_(this, f);
};

List.prototype.scanRight = function <A, B>(
  this: List<A>,
  z: B,
  f: (a: A, b: B) => B,
): List<B> {
  return scanRight_(this, z, f);
};

List.prototype.scanRight1 = function <A>(
  this: List<A>,
  f: (x: A, y: A) => A,
): List<A> {
  return scanRight1_(this, f);
};

List.prototype.traverse = function <G, A>(
  this: List<A>,
  G: Applicative<G>,
): <B>(f: (a: A) => Kind<G, [B]>) => Kind<G, [List<B>]> {
  return f => traverse_(G)(this, f);
};

List.prototype.flatTraverse = function <G, A>(
  G: Applicative<G>,
): <B>(f: (a: A) => Kind<G, [List<B>]>) => Kind<G, [List<B>]> {
  return f => flatTraverse_(G, this, f);
};

List.prototype.show = function <A>(
  this: List<A>,
  S: Show<A> = Show.fromToString(),
): string {
  return show_(S, this);
};

List.prototype.sort = function (O) {
  return sort_(this, O);
};
