import { List, Option, Vector } from '@cats4ts/cats-core/lib/data';
import { Chunk } from './algebra';
import {
  concat_,
  drop_,
  elem_,
  foldLeft_,
  isEmpty,
  lastOption,
  map_,
  nonEmpty,
  size,
  slice_,
  splitAt_,
  take_,
  toArray,
  toList,
  toVector,
  zipWith_,
} from './operators';

declare module './algebra' {
  interface Chunk<O> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    readonly size: number;

    readonly lastOption: Option<O>;

    readonly toArray: O[];
    readonly toList: List<O>;
    readonly toVector: Vector<O>;

    elem(idx: number): O;
    '!!'(idx: number): O;

    take(n: number): Chunk<O>;
    drop(n: number): Chunk<O>;
    slice(offset: number, until: number): Chunk<O>;

    splitAt(idx: number): [Chunk<O>, Chunk<O>];

    concat<O2>(this: Chunk<O2>, that: Chunk<O2>): Chunk<O2>;
    '+++'<O2>(this: Chunk<O2>, that: Chunk<O2>): Chunk<O2>;

    map<O2>(f: (o: O) => O2): Chunk<O2>;

    zipWith<O2, O3>(c2: Chunk<O2>, f: (o: O, o2: O2) => O3): Chunk<O3>;

    foldLeft<O2, B>(this: Chunk<O2>, init: B, f: (b: B, o: O) => B): B;
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

Object.defineProperty(Chunk.prototype, 'size', {
  get<O>(this: Chunk<O>): number {
    return size(this);
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

Chunk.prototype.elem = function (idx) {
  return elem_(this, idx);
};
Chunk.prototype['!!'] = Chunk.prototype.elem;

Chunk.prototype.slice = function (offset, until) {
  return slice_(this, offset, until);
};

Chunk.prototype.take = function (idx) {
  return take_(this, idx);
};

Chunk.prototype.drop = function (idx) {
  return drop_(this, idx);
};

Chunk.prototype.splitAt = function (idx) {
  return splitAt_(this, idx);
};

Chunk.prototype.concat = function (that) {
  return concat_(this, that);
};
Chunk.prototype['+++'] = Chunk.prototype.concat;

Chunk.prototype.map = function (f) {
  return map_(this, f);
};

Chunk.prototype.zipWith = function (c2, f) {
  return zipWith_(this, c2, f);
};

Chunk.prototype.foldLeft = function (init, f) {
  return foldLeft_(this, init, f);
};
