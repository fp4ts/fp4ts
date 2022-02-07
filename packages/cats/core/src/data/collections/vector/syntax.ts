// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, PrimitiveType } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Applicative } from '../../../applicative';
import { MonoidK } from '../../../monoid-k';
import { Show } from '../../../show';

import { Ior } from '../../ior';
import { Either } from '../../either';
import { Option } from '../../option';
import { List } from '../list';

import { Vector } from './algebra';
import {
  align_,
  all_,
  any_,
  append_,
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
  foldLeft1_,
  foldLeft_,
  foldMapK_,
  foldMap_,
  foldRight1_,
  foldRight_,
  forEach_,
  head,
  headOption,
  init,
  isEmpty,
  iterator,
  last,
  lastOption,
  lookup_,
  map_,
  nonEmpty,
  partition_,
  popHead,
  popLast,
  prepend_,
  reverse,
  reverseIterator,
  scanLeft1_,
  scanLeft_,
  scanRight1_,
  scanRight_,
  show,
  size,
  slice_,
  splitAt_,
  tail,
  takeRight_,
  take_,
  toArray,
  toList,
  traverse_,
  zipAllWith_,
  zipAll_,
  zipWithIndex,
  zipWith_,
  zip_,
} from './operators';

declare module './algebra' {
  interface Vector<A> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    readonly size: number;

    readonly head: A;
    readonly headOption: Option<A>;
    readonly tail: Vector<A>;

    readonly last: A;
    readonly lastOption: Option<A>;
    readonly init: Vector<A>;

    readonly popHead: Option<[A, Vector<A>]>;
    readonly popLast: Option<[A, Vector<A>]>;

    readonly toArray: A[];
    readonly toList: List<A>;
    readonly toVector: Vector<A>;

    readonly iterator: Iterator<A>;
    readonly reverseIterator: Iterator<A>;
    [Symbol.iterator](): Iterator<A>;

    readonly reverse: Vector<A>;

    equals<B>(this: Vector<B>, E: Eq<B>, xs: Vector<B>): boolean;
    notEquals<B>(this: Vector<B>, E: Eq<B>, xs: Vector<B>): boolean;

    prepend<B>(this: Vector<B>, b: B): Vector<B>;
    cons<B>(this: Vector<B>, b: B): Vector<B>;
    '+::'<B>(this: Vector<B>, b: B): Vector<B>;

    append<B>(this: Vector<B>, b: B): Vector<B>;
    snoc<B>(this: Vector<B>, b: B): Vector<B>;
    '::+'<B>(this: Vector<B>, b: B): Vector<B>;

    concat<B>(this: Vector<B>, that: Vector<B>): Vector<B>;
    '+++'<B>(this: Vector<B>, that: Vector<B>): Vector<B>;

    elem(idx: number): A;
    '!!'(idx: number): A;

    elemOption(idx: number): Option<A>;
    '!?'(idx: number): Option<A>;

    all(p: (a: A) => boolean): boolean;
    any(p: (a: A) => boolean): boolean;
    count(p: (a: A) => boolean): number;

    take(n: number): Vector<A>;
    takeRight(n: number): Vector<A>;

    drop(n: number): Vector<A>;
    dropRight(n: number): Vector<A>;

    slice(from: number, until: number): Vector<A>;
    splitAt(idx: number): [Vector<A>, Vector<A>];

    lookup<K extends PrimitiveType, V>(this: Vector<[K, V]>, k: K): Option<V>;
    lookup<K, V>(this: Vector<[K, V]>, E: Eq<K>): Option<V>;
    filter(p: (a: A) => boolean): Vector<A>;
    collect<B>(f: (a: A) => Option<B>): Vector<B>;
    collectWhile<B>(f: (a: A) => Option<B>): Vector<B>;
    map<B>(f: (a: A) => B): Vector<B>;

    flatMap<B>(f: (a: A) => Vector<B>): Vector<B>;

    readonly flatten: A extends Vector<infer B> ? Vector<B> : never;

    align<B>(ys: Vector<B>): Vector<Ior<A, B>>;
    zip<B>(ys: Vector<B>): Vector<[A, B]>;
    zipWith<B, C>(ys: Vector<B>, f: (a: A, b: B) => C): Vector<C>;

    readonly zipWithIndex: Vector<[A, number]>;

    zipAll<AA, B>(
      this: Vector<AA>,
      that: Vector<B>,
      defaultL: () => AA,
      defaultR: () => B,
    ): Vector<[AA, B]>;
    zipAllWith<AA, B, C>(
      this: Vector<AA>,
      that: Vector<B>,
      defaultL: () => AA,
      defaultR: () => B,
      f: (a: A, b: B) => C,
    ): Vector<C>;

    forEach(f: (a: A) => void): void;

    partition<L, R>(f: (a: A) => Either<L, R>): [Vector<L>, Vector<R>];

    foldLeft<B>(z: B, f: (b: B, a: A) => B): B;
    foldLeft1<B>(this: Vector<B>, f: (z: B, x: B) => B): B;
    foldRight<B>(z: B, f: (a: A, b: B) => B): B;
    foldRight1<B>(this: Vector<B>, f: (x: B, z: B) => B): B;

    foldMap<M>(M: Monoid<M>): (f: (a: A) => M) => M;
    foldMapK<F>(F: MonoidK<F>): <B>(f: (a: A) => Kind<F, [B]>) => Kind<F, [B]>;

    scanLeft<B>(z: B, f: (b: B, x: A) => B): Vector<B>;
    scanLeft1<B>(this: Vector<B>, f: (x: B, y: B) => B): Vector<B>;
    scanRight<B>(z: B, f: (x: A, b: B) => B): Vector<B>;
    scanRight1<B>(this: Vector<B>, f: (x: B, y: B) => B): Vector<B>;

    traverse<G>(
      G: Applicative<G>,
    ): <B>(f: (a: A) => Kind<G, [B]>) => Kind<G, [Vector<A>]>;

    show<B>(this: Vector<B>, S?: Show<B>): string;
  }
}

Object.defineProperty(Vector.prototype, 'isEmpty', {
  get<A>(this: Vector<A>): boolean {
    return isEmpty(this);
  },
});

Object.defineProperty(Vector.prototype, 'nonEmpty', {
  get<A>(this: Vector<A>): boolean {
    return nonEmpty(this);
  },
});

Object.defineProperty(Vector.prototype, 'size', {
  get<A>(this: Vector<A>): number {
    return size(this);
  },
});

Object.defineProperty(Vector.prototype, 'head', {
  get<A>(this: Vector<A>): A {
    return head(this);
  },
});

Object.defineProperty(Vector.prototype, 'headOption', {
  get<A>(this: Vector<A>): Option<A> {
    return headOption(this);
  },
});

Object.defineProperty(Vector.prototype, 'tail', {
  get<A>(this: Vector<A>): Vector<A> {
    return tail(this);
  },
});

Object.defineProperty(Vector.prototype, 'last', {
  get<A>(this: Vector<A>): A {
    return last(this);
  },
});

Object.defineProperty(Vector.prototype, 'lastOption', {
  get<A>(this: Vector<A>): Option<A> {
    return lastOption(this);
  },
});

Object.defineProperty(Vector.prototype, 'init', {
  get<A>(this: Vector<A>): Vector<A> {
    return init(this);
  },
});

Object.defineProperty(Vector.prototype, 'popHead', {
  get<A>(this: Vector<A>): Option<[A, Vector<A>]> {
    return popHead(this);
  },
});

Object.defineProperty(Vector.prototype, 'popLast', {
  get<A>(this: Vector<A>): Option<[A, Vector<A>]> {
    return popLast(this);
  },
});

Object.defineProperty(Vector.prototype, 'toArray', {
  get<A>(this: Vector<A>): A[] {
    return toArray(this);
  },
});

Object.defineProperty(Vector.prototype, 'toList', {
  get<A>(this: Vector<A>): List<A> {
    return toList(this);
  },
});

Object.defineProperty(Vector.prototype, 'toVector', {
  get<A>(this: Vector<A>): Vector<A> {
    return this;
  },
});

Object.defineProperty(Vector.prototype, 'iterator', {
  get<A>(this: Vector<A>): Iterator<A> {
    return iterator(this);
  },
});

Object.defineProperty(Vector.prototype, 'reverseIterator', {
  get<A>(this: Vector<A>): Iterator<A> {
    return reverseIterator(this);
  },
});

Vector.prototype[Symbol.iterator] = function () {
  return iterator(this);
};

Object.defineProperty(Vector.prototype, 'reverse', {
  get<A>(this: Vector<A>): Vector<A> {
    return reverse(this);
  },
});

Vector.prototype.equals = function (E, that) {
  return equals_(E)(this, that);
};
Vector.prototype.notEquals = function (E, that) {
  return !this.equals(E, that);
};

Vector.prototype.prepend = function (x) {
  return prepend_(this, x);
};
Vector.prototype.cons = Vector.prototype.prepend;
Vector.prototype['+::'] = Vector.prototype.prepend;

Vector.prototype.append = function (x) {
  return append_(this, x);
};
Vector.prototype.snoc = Vector.prototype.append;
Vector.prototype['::+'] = Vector.prototype.append;

Vector.prototype.concat = function (that) {
  return concat_(this, that);
};
Vector.prototype['+++'] = Vector.prototype.concat;

Vector.prototype.elem = function (idx) {
  return elem_(this, idx);
};
Vector.prototype['!!'] = Vector.prototype.elem;

Vector.prototype.elemOption = function (idx) {
  return elemOption_(this, idx);
};
Vector.prototype['!?'] = Vector.prototype.elemOption;

Vector.prototype.all = function (p) {
  return all_(this, p);
};
Vector.prototype.any = function (p) {
  return any_(this, p);
};
Vector.prototype.count = function (p) {
  return count_(this, p);
};

Vector.prototype.take = function (idx) {
  return take_(this, idx);
};
Vector.prototype.takeRight = function (idx) {
  return takeRight_(this, idx);
};

Vector.prototype.drop = function (idx) {
  return drop_(this, idx);
};
Vector.prototype.dropRight = function (idx) {
  return dropRight_(this, idx);
};

Vector.prototype.slice = function (from, until) {
  return slice_(this, from, until);
};

Vector.prototype.splitAt = function (idx) {
  return splitAt_(this, idx);
};

Vector.prototype.lookup = function (this: any, ...xs: any[]) {
  return xs.length === 2
    ? lookup_(xs[1])(this, xs[0])
    : lookup_(Eq.primitive)(this, xs[0]);
} as any;

Vector.prototype.collect = function (f) {
  return collect_(this, f);
};

Vector.prototype.collectWhile = function (f) {
  return collectWhile_(this, f);
};

Vector.prototype.filter = function (f) {
  return filter_(this, f);
};

Vector.prototype.map = function (f) {
  return map_(this, f);
};

Vector.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};

Object.defineProperty(Vector.prototype, 'flatten', {
  get<A>(this: Vector<Vector<A>>): Vector<A> {
    return flatten(this);
  },
});

Vector.prototype.align = function (that) {
  return align_(this, that);
};

Vector.prototype.zip = function (that) {
  return zip_(this, that);
};

Object.defineProperty(Vector.prototype, 'zipWithIndex', {
  get<A>(this: Vector<A>): Vector<[A, number]> {
    return zipWithIndex(this);
  },
});

Vector.prototype.zipWith = function (that, f) {
  return zipWith_(this, that)(f);
};

Vector.prototype.zipAll = function (that, defaultL, defaultR) {
  return zipAll_(this, that, defaultL, defaultR);
};

Vector.prototype.zipAllWith = function (that, defaultL, defaultR, f) {
  return zipAllWith_(this, that, defaultL, defaultR)(f);
};

Vector.prototype.forEach = function (f) {
  return forEach_(this, f);
};

Vector.prototype.partition = function (f) {
  return partition_(this, f);
};

Vector.prototype.foldLeft = function (z, f) {
  return foldLeft_(this, z, f);
};

Vector.prototype.foldLeft1 = function (f) {
  return foldLeft1_(this, f);
};

Vector.prototype.foldRight = function (z, f) {
  return foldRight_(this, z, f);
};

Vector.prototype.foldRight1 = function (f) {
  return foldRight1_(this, f);
};

Vector.prototype.foldMap = function (M) {
  return f => foldMap_(M)(this, f);
};

Vector.prototype.foldMapK = function (F) {
  return f => foldMapK_(F)(this, f);
};

Vector.prototype.scanLeft = function (z, f) {
  return scanLeft_(this, z, f);
};

Vector.prototype.scanLeft1 = function (f) {
  return scanLeft1_(this, f);
};

Vector.prototype.scanRight = function (z, f) {
  return scanRight_(this, z, f);
};

Vector.prototype.scanRight1 = function (f) {
  return scanRight1_(this, f);
};

Vector.prototype.traverse = function (G) {
  return f => traverse_(G)(this, f);
};

Vector.prototype.show = function (S = Show.fromToString()): any {
  return show(S)(this);
};
