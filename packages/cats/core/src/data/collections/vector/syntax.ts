// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, Kind, PrimitiveType } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { MonoidK } from '../../../monoid-k';
import { Applicative } from '../../../applicative';

import { Ior } from '../../ior';
import { Either } from '../../either';
import { Option } from '../../option';
import { List } from '../list';
import { View as ViewType } from '../view';

import { Vector } from './algebra';
import {
  align_,
  all_,
  any_,
  coflatMap_,
  collectWhile_,
  collect_,
  count_,
  dropRight_,
  drop_,
  elem_,
  filter_,
  flatMap_,
  foldLeft1_,
  foldLeft_,
  foldRight1Strict_,
  foldRight1_,
  foldRightStrict_,
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
  nonEmpty,
  partitionWith_,
  partition_,
  popHead,
  popLast,
  reverse,
  reverseIterator,
  scanLeft1_,
  scanLeft_,
  scanRight1_,
  scanRight_,
  splitAt_,
  tail,
  takeRight_,
  take_,
  toArray,
  toList,
  traverse_,
  view,
  zipAllWith_,
  zipAll_,
  zipWithIndex,
  zipWith_,
  zip_,
} from './operators';

declare module './algebra' {
  interface Vector<out A> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    readonly head: A;
    readonly headOption: Option<A>;
    readonly tail: Vector<A>;

    readonly last: A;
    readonly lastOption: Option<A>;
    readonly init: Vector<A>;

    readonly popHead: Option<[A, Vector<A>]>;
    readonly popLast: Option<[A, Vector<A>]>;

    readonly iterator: Iterator<A>;
    [Symbol.iterator](): Iterator<A>;
    readonly reverseIterator: Iterator<A>;

    readonly reverse: Vector<A>;

    readonly view: ViewType<A>;
    readonly toArray: A[];
    readonly toList: List<A>;

    '+::'<B>(this: Vector<B>, that: B): Vector<B>;
    '::+'<B>(this: Vector<B>, that: B): Vector<B>;

    all(p: (a: A) => boolean): boolean;
    any(p: (a: A) => boolean): boolean;
    count(p: (a: A) => boolean): number;

    elem(idx: number): A;
    '!!'(idx: number): A;
    '!?'(idx: number): Option<A>;
    lookup<K extends PrimitiveType, V>(this: Vector<[K, V]>, k: K): Option<V>;
    lookup<K, V>(this: Vector<[K, V]>, E: Eq<K>, k: K): Option<V>;
    '+++'<B>(this: Vector<B>, that: Vector<B>): Vector<B>;

    take(n: number): Vector<A>;
    takeRight(n: number): Vector<A>;
    drop(n: number): Vector<A>;
    dropRight(n: number): Vector<A>;
    splitAt(idx: number): [Vector<A>, Vector<A>];

    filter(p: (a: A) => boolean): Vector<A>;
    collect<B>(f: (a: A) => Option<B>): Vector<B>;
    collectWhile<B>(f: (a: A) => Option<A>): Vector<B>;

    flatMap<B>(f: (a: A) => Vector<B>): Vector<B>;
    coflatMap<B>(f: (as: Vector<A>) => B): Vector<B>;

    forEach(f: (a: A) => void): void;

    foldLeft<B>(z: B, f: (b: B, a: A) => B): B;
    foldLeft1<B>(this: Vector<B>, f: (b: B, a: B) => B): B;

    foldRight<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>): Eval<B>;
    foldRight1<B>(this: Vector<B>, f: (a: B, eb: Eval<B>) => Eval<B>): Eval<B>;

    foldRight_<B>(z: B, f: (a: A, b: B) => B): B;
    foldRight1_<B>(this: Vector<B>, f: (a: B, b: B) => B): B;

    foldMap<M>(M: Monoid<M>): (f: (a: A) => M) => M;
    foldMapK<F>(F: MonoidK<F>): <B>(f: (a: A) => Kind<F, [B]>) => Kind<F, [B]>;

    align<B>(that: Vector<B>): Vector<Ior<A, B>>;
    readonly zipWithIndex: Vector<[A, number]>;
    zip<B>(that: Vector<B>): Vector<[A, B]>;
    zipWith<B>(that: Vector<B>): <C>(f: (a: A, b: B) => C) => Vector<C>;
    zipAll<AA, B>(
      this: Vector<AA>,
      that: Vector<B>,
      defaultX: () => AA,
      defaultY: () => B,
    ): Vector<[AA, B]>;
    zipAllWith<AA, B>(
      this: Vector<AA>,
      that: Vector<B>,
      defaultX: () => AA,
      defaultY: () => B,
    ): <C>(f: (a: AA, b: B) => C) => Vector<C>;

    partition(f: (a: A) => boolean): [Vector<A>, Vector<A>];
    partitionWith<L, R>(f: (a: A) => Either<L, R>): [Vector<L>, Vector<R>];

    scanLeft<B>(z: B, f: (b: B, a: A) => B): Vector<B>;
    scanLeft1<B>(this: Vector<B>, f: (b: B, a: B) => B): Vector<B>;

    scanRight<B>(z: B, f: (a: A, b: B) => B): Vector<B>;
    scanRight1<B>(this: Vector<B>, f: (a: B, b: B) => B): Vector<B>;

    traverse<F>(
      F: Applicative<F>,
    ): <B>(f: (a: A) => Kind<F, [B]>) => Kind<F, [Vector<B>]>;
  }
}

Object.defineProperty(Vector.prototype, 'isEmpty', {
  get<A>(this: Vector<A>) {
    return isEmpty(this);
  },
});
Object.defineProperty(Vector.prototype, 'nonEmpty', {
  get<A>(this: Vector<A>) {
    return nonEmpty(this);
  },
});

Object.defineProperty(Vector.prototype, 'head', {
  get<A>(this: Vector<A>) {
    return head(this);
  },
});
Object.defineProperty(Vector.prototype, 'headOption', {
  get<A>(this: Vector<A>) {
    return headOption(this);
  },
});
Object.defineProperty(Vector.prototype, 'tail', {
  get<A>(this: Vector<A>) {
    return tail(this);
  },
});

Object.defineProperty(Vector.prototype, 'last', {
  get<A>(this: Vector<A>) {
    return last(this);
  },
});
Object.defineProperty(Vector.prototype, 'lastOption', {
  get<A>(this: Vector<A>) {
    return lastOption(this);
  },
});
Object.defineProperty(Vector.prototype, 'init', {
  get<A>(this: Vector<A>) {
    return init(this);
  },
});

Object.defineProperty(Vector.prototype, 'popHead', {
  get<A>(this: Vector<A>) {
    return popHead(this);
  },
});
Object.defineProperty(Vector.prototype, 'popLast', {
  get<A>(this: Vector<A>) {
    return popLast(this);
  },
});

Object.defineProperty(Vector.prototype, 'iterator', {
  get<A>(this: Vector<A>) {
    return iterator(this);
  },
});
Vector.prototype[Symbol.iterator] = function () {
  return this.iterator;
};
Object.defineProperty(Vector.prototype, 'reverseIterator', {
  get<A>(this: Vector<A>) {
    return reverseIterator(this);
  },
});

Object.defineProperty(Vector.prototype, 'reverse', {
  get<A>(this: Vector<A>) {
    return reverse(this);
  },
});

Object.defineProperty(Vector.prototype, 'view', {
  get<A>(this: Vector<A>) {
    return view(this);
  },
});
Object.defineProperty(Vector.prototype, 'toArray', {
  get<A>(this: Vector<A>) {
    return toArray(this);
  },
});
Object.defineProperty(Vector.prototype, 'toList', {
  get<A>(this: Vector<A>) {
    return toList(this);
  },
});

Vector.prototype['+::'] = function (that) {
  return this.prepend(that);
};
Vector.prototype['::+'] = function (that) {
  return this.append(that);
};

Vector.prototype.all = function (p) {
  return all_(this, p);
};
Vector.prototype.any = function (p) {
  return any_(this, p);
};
Vector.prototype.count = function (p) {
  return count_(this, p);
};

Vector.prototype.elem = function (idx) {
  return elem_(this, idx);
};
Vector.prototype['!!'] = Vector.prototype.elem;
Vector.prototype['!?'] = function (idx) {
  return this.elemOption(idx);
};
Vector.prototype.lookup = function (...args: any[]) {
  return args.length === 1
    ? lookup_(Eq.fromUniversalEquals(), this, args[0])
    : lookup_(args[0], this, args[1]);
};
Vector.prototype['+++'] = Vector.prototype.concat;

Vector.prototype.take = function (n) {
  return take_(this, n);
};
Vector.prototype.takeRight = function (n) {
  return takeRight_(this, n);
};
Vector.prototype.drop = function (n) {
  return drop_(this, n);
};
Vector.prototype.dropRight = function (n) {
  return dropRight_(this, n);
};

Vector.prototype.splitAt = function (idx) {
  return splitAt_(this, idx);
};

Vector.prototype.filter = function (p) {
  return filter_(this, p);
};
Vector.prototype.collect = function (f) {
  return collect_(this, f);
};
Vector.prototype.collectWhile = function (f) {
  return collectWhile_(this, f);
};

Vector.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};
Vector.prototype.coflatMap = function (f) {
  return coflatMap_(this, f);
};
Vector.prototype.forEach = function (f) {
  return forEach_(this, f);
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

Vector.prototype.foldRight_ = function (z, f) {
  return foldRightStrict_(this, z, f);
};
Vector.prototype.foldRight1_ = function (f) {
  return foldRight1Strict_(this, f);
};

Vector.prototype.align = function (that) {
  return align_(this, that);
};
Object.defineProperty(Vector.prototype, 'zipWithIndex', {
  get<A>(this: Vector<A>) {
    return zipWithIndex(this);
  },
});
Vector.prototype.zip = function (that) {
  return zip_(this, that);
};
Vector.prototype.zipWith = function (that) {
  return zipWith_(this, that);
};
Vector.prototype.zipAll = function (that, defaultX, defaultY) {
  return zipAll_(this, that, defaultX, defaultY);
};
Vector.prototype.zipAllWith = function (that, defaultX, defaultY) {
  return zipAllWith_(this, that, defaultX, defaultY);
};

Vector.prototype.partition = function (f) {
  return partition_(this, f);
};
Vector.prototype.partitionWith = function (f) {
  return partitionWith_(this, f);
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

Vector.prototype.traverse = function (F) {
  return f => traverse_(F)(this, f);
};
