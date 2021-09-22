import { Chunk } from './algebra';
import { elem_, foldLeft_, isEmpty, map_, nonEmpty, size } from './operators';

declare module './algebra' {
  interface Chunk<O> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    readonly size: number;

    elem(idx: number): O;
    '!!'(idx: number): O;

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

Chunk.prototype.elem = function (idx) {
  return elem_(this, idx);
};
Chunk.prototype['!!'] = Chunk.prototype.elem;

Chunk.prototype.map = function (f) {
  return map_(this, f);
};

Chunk.prototype.foldLeft = function (init, f) {
  return foldLeft_(this, init, f);
};
