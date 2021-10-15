import { Kind } from '@cats4ts/core';
import { Eval, Applicative, List, Option, Vector } from '@cats4ts/cats';

import { Chunk } from './algebra';
import {
  collect_,
  concat_,
  dropRight_,
  drop_,
  elem_,
  filter_,
  findIndex_,
  flatMap_,
  flatten,
  foldLeft_,
  foldRight_,
  forEach_,
  isEmpty,
  iterator,
  lastOption,
  mapAccumulate_,
  map_,
  nonEmpty,
  scanLeftCarry_,
  scanLeft_,
  slice_,
  splitAt_,
  takeRight_,
  take_,
  toArray,
  toList,
  toVector,
  traverse_,
  zipWith_,
} from './operators';

declare module './algebra' {
  interface Chunk<O> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    readonly lastOption: Option<O>;

    readonly toArray: O[];
    readonly toList: List<O>;
    readonly toVector: Vector<O>;

    readonly iterator: Iterator<O>;
    [Symbol.iterator](): Iterator<O>;

    findIndex(pred: (o: O) => boolean): Option<number>;

    take(n: number): Chunk<O>;
    takeRight(n: number): Chunk<O>;
    drop(n: number): Chunk<O>;
    dropRight(n: number): Chunk<O>;
    slice(offset: number, until: number): Chunk<O>;

    elem(idx: number): O;
    '!!'(idx: number): O;

    splitAt(idx: number): [Chunk<O>, Chunk<O>];

    concat<O2>(this: Chunk<O2>, that: Chunk<O2>): Chunk<O2>;
    '+++'<O2>(this: Chunk<O2>, that: Chunk<O2>): Chunk<O2>;

    filter(pred: (o: O) => boolean): Chunk<O>;
    collect<O2>(f: (o: O) => Option<O2>): Chunk<O2>;

    map<O2>(f: (o: O) => O2): Chunk<O2>;
    mapAccumulate<S>(s: S): <O2>(f: (s: S, o: O) => [S, O2]) => [S, Chunk<O2>];

    flatMap<O2>(f: (o: O) => Chunk<O2>): Chunk<O2>;
    readonly flatten: O extends Chunk<infer O2> ? Chunk<O2> : never;

    forEach(f: (o: O) => void): void;
    foldLeft<B>(init: B, f: (b: B, o: O) => B): B;
    foldRight<B>(init: Eval<B>, f: (o: O, eb: Eval<B>) => Eval<B>): Eval<B>;

    scanLeft<O2>(z: O2, f: (o2: O2, o: O) => O2): Chunk<O2>;
    scanLeftCarry<O2>(z: O2, f: (o2: O2, o: O) => O2): [Chunk<O2>, O2];

    zipWith<O2, O3>(c2: Chunk<O2>, f: (o: O, o2: O2) => O3): Chunk<O3>;

    traverse<F>(
      F: Applicative<F>,
    ): <O2>(f: (o: O) => Kind<F, [O2]>) => Kind<F, [Chunk<O2>]>;
  }
}

Object.defineProperty(Chunk.prototype, 'isEmpty', {
  get<O>(this: Chunk<O>): boolean {
    return isEmpty(this);
  },
});

Object.defineProperty(Chunk.prototype, 'nonEmpty', {
  get<O>(this: Chunk<O>): boolean {
    return nonEmpty(this);
  },
});

Object.defineProperty(Chunk.prototype, 'lastOption', {
  get<O>(this: Chunk<O>): Option<O> {
    return lastOption(this);
  },
});

Object.defineProperty(Chunk.prototype, 'toArray', {
  get<O>(this: Chunk<O>): O[] {
    return toArray(this);
  },
});

Object.defineProperty(Chunk.prototype, 'toList', {
  get<O>(this: Chunk<O>): List<O> {
    return toList(this);
  },
});

Object.defineProperty(Chunk.prototype, 'toVector', {
  get<O>(this: Chunk<O>): Vector<O> {
    return toVector(this);
  },
});

Object.defineProperty(Chunk.prototype, 'iterator', {
  get<O>(this: Chunk<O>) {
    return iterator(this);
  },
});

Chunk.prototype[Symbol.iterator] = function () {
  return iterator(this);
};

Chunk.prototype.slice = function (offset, until) {
  return slice_(this, offset, until);
};

Chunk.prototype.take = function (idx) {
  return take_(this, idx);
};

Chunk.prototype.takeRight = function (idx) {
  return takeRight_(this, idx);
};

Chunk.prototype.drop = function (idx) {
  return drop_(this, idx);
};

Chunk.prototype.dropRight = function (idx) {
  return dropRight_(this, idx);
};

Chunk.prototype.findIndex = function (pred) {
  return findIndex_(this, pred);
};

Chunk.prototype.elem = function (idx) {
  return elem_(this, idx);
};
Chunk.prototype['!!'] = Chunk.prototype.elem;

Chunk.prototype.splitAt = function (idx) {
  return splitAt_(this, idx);
};

Chunk.prototype.concat = function (that) {
  return concat_(this, that);
};
Chunk.prototype['+++'] = Chunk.prototype.concat;

Chunk.prototype.filter = function (pred) {
  return filter_(this, pred);
};
Chunk.prototype.collect = function (pred) {
  return collect_(this, pred);
};

Chunk.prototype.map = function (f) {
  return map_(this, f);
};

Chunk.prototype.mapAccumulate = function (s) {
  return f => mapAccumulate_(this, s, f);
};

Chunk.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};

Object.defineProperty(Chunk.prototype, 'flatten', {
  get<O>(this: Chunk<Chunk<O>>): Chunk<O> {
    return flatten(this);
  },
});

Chunk.prototype.forEach = function (f) {
  return forEach_(this, f);
};

Chunk.prototype.foldLeft = function (init, f) {
  return foldLeft_(this, init, f);
};

Chunk.prototype.foldRight = function (init, f) {
  return foldRight_(this, init, f);
};

Chunk.prototype.scanLeft = function (init, f) {
  return scanLeft_(this, init, f);
};

Chunk.prototype.scanLeftCarry = function (init, f) {
  return scanLeftCarry_(this, init, f);
};

Chunk.prototype.zipWith = function (c2, f) {
  return zipWith_(this, c2, f);
};

Chunk.prototype.traverse = function (F) {
  return f => traverse_(F)(this, f);
};
