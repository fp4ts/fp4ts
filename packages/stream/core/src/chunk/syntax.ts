import { Chunk } from './algebra';
import { isEmpty, map_, nonEmpty } from './operators';

declare module './algebra' {
  interface Chunk<O> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    map<O2>(f: (o: O) => O2): Chunk<O2>;
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

Chunk.prototype.map = function (f) {
  return map_(this, f);
};
