import { List, Vector } from '@cats4ts/cats-core/lib/data';
import { Chunk } from './algebra';
import {
  concat_,
  elem_,
  foldLeft_,
  isEmpty,
  map_,
  nonEmpty,
  size,
  toArray,
  toList,
  toVector,
} from './operators';

declare module './algebra' {
  interface Chunk<O> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    readonly size: number;

    readonly toArray: O[];
    readonly toList: List<O>;
    readonly toVector: Vector<O>;

    elem(idx: number): O;
    '!!'(idx: number): O;

    concat<O2>(this: Chunk<O2>, that: Chunk<O2>): Chunk<O2>;
    '+++'<O2>(this: Chunk<O2>, that: Chunk<O2>): Chunk<O2>;

    map<O2>(f: (o: O) => O2): Chunk<O2>;

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

Chunk.prototype.concat = function (that) {
  return concat_(this, that);
};
Chunk.prototype['+++'] = Chunk.prototype.concat;

Chunk.prototype.map = function (f) {
  return map_(this, f);
};

Chunk.prototype.foldLeft = function (init, f) {
  return foldLeft_(this, init, f);
};
