// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Eq, Monoid, Ord } from '@fp4ts/cats-kernel';
import { MonoidK } from '../../../monoid-k';
import { Option } from '../../option';

import { List } from '../list';
import { Vector } from '../vector';

import {
  all_,
  any_,
  contains_,
  count_,
  difference_,
  dropRight_,
  drop_,
  elemOption_,
  elem_,
  equals_,
  filter_,
  foldLeft1_,
  foldLeft_,
  foldMapK_,
  foldMapLeft_,
  foldMap_,
  foldRight1_,
  foldRightStrict_,
  forEach_,
  head,
  headOption,
  init,
  insert_,
  intersection_,
  isEmpty,
  iterator,
  last,
  lastOption,
  map_,
  max,
  min,
  nonEmpty,
  partition_,
  popMax,
  popMin,
  remove_,
  reverseIterator,
  slice_,
  split_,
  symmetricDifference_,
  tail,
  takeRight_,
  take_,
  toArray,
  toList,
  toVector,
  union_,
} from './operators';
import { Set } from './algebra';

declare module './algebra' {
  interface Set<out A> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    readonly head: A;
    readonly headOption: Option<A>;
    readonly tail: Set<A>;

    readonly last: A;
    readonly lastOption: Option<A>;
    readonly init: Set<A>;

    readonly min: Option<A>;
    readonly popMin: Option<[A, Set<A>]>;

    readonly max: Option<A>;
    readonly popMax: Option<[A, Set<A>]>;

    readonly iterator: Iterator<A>;
    [Symbol.iterator](): Iterator<A>;

    readonly reverseIterator: Iterator<A>;

    readonly toArray: A[];
    readonly toList: List<A>;
    readonly toVector: Vector<A>;

    contains<B>(this: Set<A>, x: B, O?: Ord<B>): boolean;

    all(p: (a: A) => boolean): boolean;
    any(p: (a: A) => boolean): boolean;
    count(p: (a: A) => boolean): number;

    elem(idx: number): A;
    '!!'(idx: number): A;

    elemOption(idx: number): Option<A>;
    '!?'(idx: number): Option<A>;

    take(n: number): Set<A>;
    takeRight(n: number): Set<A>;

    drop(n: number): Set<A>;
    dropRight(n: number): Set<A>;

    slice(from: number, until: number): Set<A>;

    insert<B>(this: Set<B>, x: B, O?: Ord<B>): Set<B>;
    remove<B>(this: Set<B>, x: B, O?: Ord<B>): Set<B>;

    union<B>(this: Set<B>, that: Set<B>, O?: Ord<B>): Set<B>;
    '+++'<B>(this: Set<B>, that: Set<B>, O?: Ord<B>): Set<B>;

    intersect<B>(this: Set<B>, that: Set<B>, O?: Ord<B>): Set<B>;

    difference<B>(this: Set<B>, that: Set<B>, O?: Ord<B>): Set<B>;
    '\\'<B>(this: Set<B>, that: Set<B>, O?: Ord<B>): Set<B>;

    symmetricDifference<B>(this: Set<B>, that: Set<B>, O?: Ord<B>): Set<B>;
    '\\//'<B>(this: Set<B>, that: Set<B>, O?: Ord<B>): Set<B>;

    split<B>(this: Set<B>, x: B, O?: Ord<B>): [Set<B>, Set<B>];

    filter(p: (a: A) => boolean): Set<A>;

    map<B>(f: (a: A) => B, O?: Ord<B>): Set<B>;

    forEach(f: (a: A) => void): void;

    partition(p: (a: A) => boolean): [Set<A>, Set<A>];

    foldLeft<B>(z: B, f: (b: B, x: A) => B): B;
    foldLeft1<B>(this: Set<B>, f: (b: B, x: B) => B): B;

    foldRight<B>(z: B, f: (x: A, b: B) => B): B;
    foldRight1<B>(this: Set<B>, f: (x: B, b: B) => B): B;

    foldMap<M>(M: Monoid<M>): (f: (a: A) => M) => M;
    foldMapLeft<M>(M: Monoid<M>): (f: (a: A) => M) => M;
    foldMapK<F>(F: MonoidK<F>): <B>(f: (a: A) => Kind<F, [B]>) => Kind<F, [B]>;

    equals<B>(this: Set<B>, E: Eq<B>): (that: Set<B>) => boolean;
  }
}

Object.defineProperty(Set.prototype, 'isEmpty', {
  get<A>(this: Set<A>): boolean {
    return isEmpty(this);
  },
});

Object.defineProperty(Set.prototype, 'nonEmpty', {
  get<A>(this: Set<A>): boolean {
    return nonEmpty(this);
  },
});

Object.defineProperty(Set.prototype, 'head', {
  get<A>(this: Set<A>): A {
    return head(this);
  },
});

Object.defineProperty(Set.prototype, 'headOption', {
  get<A>(this: Set<A>): Option<A> {
    return headOption(this);
  },
});

Object.defineProperty(Set.prototype, 'tail', {
  get<A>(this: Set<A>): Set<A> {
    return tail(this);
  },
});

Object.defineProperty(Set.prototype, 'last', {
  get<A>(this: Set<A>): A {
    return last(this);
  },
});

Object.defineProperty(Set.prototype, 'lastOption', {
  get<A>(this: Set<A>): Option<A> {
    return lastOption(this);
  },
});

Object.defineProperty(Set.prototype, 'init', {
  get<A>(this: Set<A>): Set<A> {
    return init(this);
  },
});

Object.defineProperty(Set.prototype, 'min', {
  get<A>(this: Set<A>): Option<A> {
    return min(this);
  },
});

Object.defineProperty(Set.prototype, 'popMin', {
  get<A>(this: Set<A>): Option<[A, Set<A>]> {
    return popMin(this);
  },
});

Object.defineProperty(Set.prototype, 'max', {
  get<A>(this: Set<A>): Option<A> {
    return max(this);
  },
});

Object.defineProperty(Set.prototype, 'popMax', {
  get<A>(this: Set<A>): Option<[A, Set<A>]> {
    return popMax(this);
  },
});

Object.defineProperty(Set.prototype, 'iterator', {
  get<A>(this: Set<A>): Iterator<A> {
    return iterator(this);
  },
});

Set.prototype[Symbol.iterator] = function () {
  return this.iterator;
};

Object.defineProperty(Set.prototype, 'reverseIterator', {
  get<A>(this: Set<A>): Iterator<A> {
    return reverseIterator(this);
  },
});

Object.defineProperty(Set.prototype, 'toArray', {
  get<A>(this: Set<A>) {
    return toArray(this);
  },
});

Object.defineProperty(Set.prototype, 'toList', {
  get<A>(this: Set<A>) {
    return toList(this);
  },
});

Object.defineProperty(Set.prototype, 'toVector', {
  get<A>(this: Set<A>) {
    return toVector(this);
  },
});

Set.prototype.contains = function (x, O = Ord.fromUniversalCompare()) {
  return contains_(O, this, x);
};

Set.prototype.all = function (p) {
  return all_(this, p);
};

Set.prototype.any = function (p) {
  return any_(this, p);
};

Set.prototype.count = function (p) {
  return count_(this, p);
};

Set.prototype.elem = function (idx) {
  return elem_(this, idx);
};
Set.prototype['!!'] = Set.prototype.elem;

Set.prototype.elemOption = function (idx) {
  return elemOption_(this, idx);
};
Set.prototype['!?'] = Set.prototype.elemOption;

Set.prototype.take = function (n) {
  return take_(this, n);
};
Set.prototype.takeRight = function (n) {
  return takeRight_(this, n);
};

Set.prototype.drop = function (n) {
  return drop_(this, n);
};
Set.prototype.dropRight = function (n) {
  return dropRight_(this, n);
};

Set.prototype.slice = function (from, until) {
  return slice_(this, from, until);
};

Set.prototype.insert = function (x, O = Ord.fromUniversalCompare()) {
  return insert_(O, this, x);
};

Set.prototype.remove = function (x, O = Ord.fromUniversalCompare()) {
  return remove_(O, this, x);
};

Set.prototype.union = function (that, O = Ord.fromUniversalCompare()) {
  return union_(O, this, that);
};
Set.prototype['+++'] = Set.prototype.union;

Set.prototype.intersect = function (that, O = Ord.fromUniversalCompare()) {
  return intersection_(O, this, that);
};

Set.prototype.difference = function (that, O = Ord.fromUniversalCompare()) {
  return difference_(O, this, that);
};
Set.prototype['\\'] = Set.prototype.difference;

Set.prototype.symmetricDifference = function (
  that,
  O = Ord.fromUniversalCompare(),
) {
  return symmetricDifference_(O, this, that);
};
Set.prototype['\\//'] = Set.prototype.symmetricDifference;

Set.prototype.split = function (x, O = Ord.fromUniversalCompare()) {
  return split_(O, this, x);
};

Set.prototype.filter = function (p) {
  return filter_(this, p);
};

Set.prototype.map = function (...args: any[]) {
  return args.length === 1
    ? map_(Ord.fromUniversalCompare(), this, args[0])
    : map_(args[0], this, args[1]);
};

Set.prototype.forEach = function (f) {
  return forEach_(this, f);
};

Set.prototype.partition = function (f) {
  return partition_(this, f);
};

Set.prototype.foldLeft = function (z, f) {
  return foldLeft_(this, z, f);
};
Set.prototype.foldLeft1 = function (f) {
  return foldLeft1_(this, f);
};

Set.prototype.foldRight = function (z, f) {
  return foldRightStrict_(this, z, f);
};
Set.prototype.foldRight1 = function (f) {
  return foldRight1_(this, f);
};

Set.prototype.foldMap = function (M) {
  return f => foldMap_(M)(this, f);
};
Set.prototype.foldMapLeft = function (M) {
  return f => foldMapLeft_(M)(this, f);
};
Set.prototype.foldMapK = function (F) {
  return f => foldMapK_(F)(this, f);
};

Set.prototype.equals = function (E) {
  return that => equals_(E)(this, that);
};
