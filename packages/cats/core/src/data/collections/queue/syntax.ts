// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { Applicative } from '../../../applicative';
import { MonoidK } from '../../../monoid-k';

import { Ior } from '../../ior';
import { Either } from '../../either';
import { Option } from '../../option';
import { Vector } from '../vector';
import { List } from '../list';
import { Queue } from './algebra';
import {
  align_,
  all_,
  any_,
  append_,
  coflatMap_,
  collectWhile_,
  collect_,
  concat_,
  count_,
  dequeue,
  dropRight_,
  drop_,
  elemOption_,
  elem_,
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
  size,
  slice_,
  splitAt_,
  tail,
  takeRight_,
  take_,
  toArray,
  toList,
  toVector,
  traverse_,
  uncons,
  zipAllWith_,
  zipAll_,
  zipWithIndex,
  zipWith_,
  zip_,
} from './operators';

declare module './algebra' {
  interface Queue<out A> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    readonly size: number;

    readonly head: A;
    readonly headOption: Option<A>;
    readonly tail: Queue<A>;

    readonly dequeue: Option<[A, Queue<A>]>;
    readonly uncons: Option<[A, Queue<A>]>;
    readonly popHead: Option<[A, Queue<A>]>;

    readonly last: A;
    readonly lastOption: Option<A>;
    readonly init: Queue<A>;

    readonly popLast: Option<[A, Queue<A>]>;

    readonly reverse: Queue<A>;

    readonly iterator: Iterator<A>;
    readonly reverseIterator: Iterator<A>;
    [Symbol.iterator](): Iterator<A>;

    readonly toArray: A[];
    readonly toList: List<A>;
    readonly toVector: Vector<A>;

    // equals<B>(this: Queue<B>, E: Eq<B>, that: Queue<B>): boolean;
    // notEquals<B>(this: Queue<B>, E: Eq<B>, that: Queue<B>): boolean;

    enqueue<B>(this: Queue<B>, x: B): Queue<B>;
    prepend<B>(this: Queue<B>, x: B): Queue<B>;
    cons<B>(this: Queue<B>, x: B): Queue<B>;
    '+::'<B>(this: Queue<B>, x: B): Queue<B>;

    append<B>(this: Queue<B>, x: B): Queue<B>;
    snoc<B>(this: Queue<B>, x: B): Queue<B>;
    '::+'<B>(this: Queue<B>, x: B): Queue<B>;

    concat<B>(this: Queue<B>, xs: Queue<B>): Queue<B>;
    '+++'<B>(this: Queue<B>, xs: Queue<B>): Queue<B>;

    elem(idx: number): A;
    '!!'(idx: number): A;

    elemOption(idx: number): Option<A>;
    '!?'(idx: number): Option<A>;

    all(p: (a: A) => boolean): boolean;
    any(p: (a: A) => boolean): boolean;
    count(p: (a: A) => boolean): number;

    take(n: number): Queue<A>;
    takeRight(n: number): Queue<A>;

    drop(n: number): Queue<A>;
    dropRight(n: number): Queue<A>;

    slice(from: number, until: number): Queue<A>;
    splitAt(idx: number): [Queue<A>, Queue<A>];

    filter: (p: (a: A) => boolean) => Queue<A>;
    collect: <B>(f: (a: A) => Option<B>) => Queue<B>;
    collectWhile: <B>(f: (a: A) => Option<B>) => Queue<B>;
    map: <B>(f: (a: A) => B) => Queue<B>;

    flatMap<B>(f: (a: A) => Queue<B>): Queue<B>;
    coflatMap<B>(f: (as: Queue<A>) => B): Queue<B>;

    readonly flatten: A extends Queue<infer B> ? Queue<B> : never;

    foldLeft<B>(z: B, f: (b: B, a: A) => B): B;
    foldLeft1<B>(this: Queue<B>, f: (x: B, a: B) => B): B;
    foldRight<B>(z: B, f: (a: A, b: B) => B): B;
    foldRight1<B>(this: Queue<B>, f: (x: B, a: B) => B): B;

    foldMap<M>(M: Monoid<M>): (f: (a: A) => M) => M;
    foldMapK<F>(F: MonoidK<F>): <B>(f: (a: A) => Kind<F, [B]>) => Kind<F, [B]>;

    align<B>(ys: Queue<B>): Queue<Ior<A, B>>;
    zip<B>(ys: Queue<B>): Queue<[A, B]>;
    zipWith<B, C>(ys: Queue<B>, f: (a: A, b: B) => C): Queue<C>;

    readonly zipWithIndex: Queue<[A, number]>;

    zipAll<AA, B>(
      this: Queue<AA>,
      ys: Queue<B>,
      defaultL: () => AA,
      defaultR: () => B,
    ): Queue<[AA, B]>;

    zipAllWith<AA, B, C>(
      this: Queue<AA>,
      ys: Queue<B>,
      defaultL: () => AA,
      defaultR: () => B,
      f: (a: AA, b: B) => C,
    ): Queue<C>;

    forEach(f: (a: A) => void): void;

    partition<L, R>(f: (a: A) => Either<L, R>): [Queue<L>, Queue<R>];

    scanLeft<B>(z: B, f: (b: B, a: A) => B): Queue<B>;
    scanLeft1<B>(this: Queue<B>, f: (x: B, y: B) => B): Queue<B>;
    scanRight<B>(z: B, f: (a: A, b: B) => B): Queue<B>;
    scanRight1<B>(this: Queue<B>, f: (x: B, y: B) => B): Queue<B>;

    traverse<G>(
      G: Applicative<G>,
    ): <B>(f: (a: A) => Kind<G, [B]>) => Kind<G, [Queue<B>]>;
  }
}

Object.defineProperty(Queue.prototype, 'isEmpty', {
  get<A>(this: Queue<A>): boolean {
    return isEmpty(this);
  },
});

Object.defineProperty(Queue.prototype, 'nonEmpty', {
  get<A>(this: Queue<A>): boolean {
    return nonEmpty(this);
  },
});

Object.defineProperty(Queue.prototype, 'size', {
  get<A>(this: Queue<A>): unknown {
    return size(this);
  },
});

Object.defineProperty(Queue.prototype, 'head', {
  get<A>(this: Queue<A>): A {
    return head(this);
  },
});

Object.defineProperty(Queue.prototype, 'headOption', {
  get<A>(this: Queue<A>): Option<A> {
    return headOption(this);
  },
});

Object.defineProperty(Queue.prototype, 'tail', {
  get<A>(this: Queue<A>): Queue<A> {
    return tail(this);
  },
});

Object.defineProperty(Queue.prototype, 'dequeue', {
  get<A>(this: Queue<A>): Option<[A, Queue<A>]> {
    return dequeue(this);
  },
});
Object.defineProperty(Queue.prototype, 'uncons', {
  get<A>(this: Queue<A>): Option<[A, Queue<A>]> {
    return uncons(this);
  },
});
Object.defineProperty(Queue.prototype, 'popHead', {
  get<A>(this: Queue<A>): Option<[A, Queue<A>]> {
    return popHead(this);
  },
});

Object.defineProperty(Queue.prototype, 'last', {
  get<A>(this: Queue<A>): A {
    return last(this);
  },
});

Object.defineProperty(Queue.prototype, 'lastOption', {
  get<A>(this: Queue<A>): Option<A> {
    return lastOption(this);
  },
});
Object.defineProperty(Queue.prototype, 'init', {
  get<A>(this: Queue<A>): Queue<A> {
    return init(this);
  },
});
Object.defineProperty(Queue.prototype, 'popLast', {
  get<A>(this: Queue<A>): Option<[A, Queue<A>]> {
    return popLast(this);
  },
});

Object.defineProperty(Queue.prototype, 'reverse', {
  get<A>(this: Queue<A>): Queue<A> {
    return reverse(this);
  },
});

Object.defineProperty(Queue.prototype, 'iterator', {
  get<A>(this: Queue<A>): Iterator<A> {
    return iterator(this);
  },
});

Object.defineProperty(Queue.prototype, 'reverseIterator', {
  get<A>(this: Queue<A>): Iterator<A> {
    return reverseIterator(this);
  },
});

Queue.prototype[Symbol.iterator] = function () {
  return iterator(this);
};

Object.defineProperty(Queue.prototype, 'toArray', {
  get<A>(this: Queue<A>): A[] {
    return toArray(this);
  },
});

Object.defineProperty(Queue.prototype, 'toList', {
  get<A>(this: Queue<A>): List<A> {
    return toList(this);
  },
});

Object.defineProperty(Queue.prototype, 'toVector', {
  get<A>(this: Queue<A>): Vector<A> {
    return toVector(this);
  },
});

Queue.prototype.prepend = function (x) {
  return prepend_(this, x);
};
Queue.prototype.cons = Queue.prototype.prepend;
Queue.prototype['+::'] = Queue.prototype.prepend;

Queue.prototype.enqueue = function (x) {
  return append_(this, x);
};
Queue.prototype.append = Queue.prototype.enqueue;
Queue.prototype.snoc = Queue.prototype.append;
Queue.prototype['::+'] = Queue.prototype.append;

Queue.prototype.concat = function (this, that) {
  return concat_(this, that);
};
Queue.prototype['+++'] = Queue.prototype.concat;

Queue.prototype.elem = function (idx) {
  return elem_(this, idx);
};
Queue.prototype['!!'] = Queue.prototype.elem;

Queue.prototype.elemOption = function (idx) {
  return elemOption_(this, idx);
};
Queue.prototype['!?'] = Queue.prototype.elemOption;

Queue.prototype.all = function (p) {
  return all_(this, p);
};

Queue.prototype.any = function (p) {
  return any_(this, p);
};

Queue.prototype.count = function (p): number {
  return count_(this, p);
};

Queue.prototype.take = function (n: number) {
  return take_(this, n);
};

Queue.prototype.takeRight = function (n) {
  return takeRight_(this, n);
};

Queue.prototype.drop = function (n) {
  return drop_(this, n);
};

Queue.prototype.dropRight = function (n) {
  return dropRight_(this, n);
};

Queue.prototype.slice = function (from, until) {
  return slice_(this, from, until);
};

Queue.prototype.splitAt = function (idx) {
  return splitAt_(this, idx);
};

Queue.prototype.filter = function (p) {
  return filter_(this, p);
};
Queue.prototype.collect = function (p) {
  return collect_(this, p);
};
Queue.prototype.collectWhile = function (p) {
  return collectWhile_(this, p);
};

Queue.prototype.map = function (f) {
  return map_(this, f);
};

Queue.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};

Queue.prototype.coflatMap = function (f) {
  return coflatMap_(this, f);
};

Object.defineProperty(Queue.prototype, 'flatten', {
  get<A>(this: Queue<Queue<A>>): Queue<A> {
    return flatten(this);
  },
});

Queue.prototype.foldLeft = function (z, f) {
  return foldLeft_(this, z, f);
};

Queue.prototype.foldLeft1 = function (f) {
  return foldLeft1_(this, f);
};

Queue.prototype.foldRight = function (z, f) {
  return foldRight_(this, z, f);
};

Queue.prototype.foldRight1 = function (f) {
  return foldRight1_(this, f);
};

Queue.prototype.foldMap = function (M) {
  return f => foldMap_(M)(this, f);
};

Queue.prototype.foldMapK = function (F) {
  return f => foldMapK_(F)(this, f);
};

Queue.prototype.align = function (that) {
  return align_(this, that);
};

Queue.prototype.zip = function (that) {
  return zip_(this, that);
};

Queue.prototype.zipWith = function (that, f) {
  return zipWith_(this, that)(f);
};

Object.defineProperty(Queue.prototype, 'zipWithIndex', {
  get<A>(this: Queue<A>): Queue<[A, number]> {
    return zipWithIndex(this);
  },
});

Queue.prototype.zipAll = function (that, defaultL, defaultR) {
  return zipAll_(this, that, defaultL, defaultR);
};

Queue.prototype.zipAllWith = function (that, defaultL, defaultR, f) {
  return zipAllWith_(this, that, defaultL, defaultR)(f);
};

Queue.prototype.forEach = function (f) {
  return forEach_(this, f);
};

Queue.prototype.partition = function (f) {
  return partition_(this, f);
};

Queue.prototype.scanLeft = function (z, f) {
  return scanLeft_(this, z, f);
};

Queue.prototype.scanLeft1 = function (f) {
  return scanLeft1_(this, f);
};

Queue.prototype.scanRight = function (z, f) {
  return scanRight_(this, z, f);
};

Queue.prototype.scanRight1 = function (f) {
  return scanRight1_(this, f);
};

Queue.prototype.traverse = function (G) {
  return f => traverse_(G)(this, f);
};
