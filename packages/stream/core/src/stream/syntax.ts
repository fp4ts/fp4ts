import { MonadError } from '@cats4ts/cats-core';
import { AnyK } from '@cats4ts/core';
import { SyncIoK } from '@cats4ts/effect-core';
import { Stream } from './algebra';
import { Compiler, PureCompiler } from './compiler';
import {
  concat_,
  map_,
  flatMap_,
  flatten,
  compileF,
  compile,
} from './operators';

declare module './algebra' {
  interface Stream<F extends AnyK, A> {
    concat<B>(this: Stream<F, B>, that: Stream<F, B>): Stream<F, B>;
    '+++'<B>(this: Stream<F, B>, that: Stream<F, B>): Stream<F, B>;

    map<B>(f: (a: A) => B): Stream<F, B>;

    flatMap<B>(f: (a: A) => Stream<F, B>): Stream<F, B>;

    readonly flatten: A extends Stream<F, infer B> ? Stream<F, B> : never;

    compile: F extends SyncIoK ? PureCompiler<A> : never;
    compileF(F: MonadError<F, Error>): Compiler<F, A>;
  }
}

Stream.prototype.concat = function (that) {
  return concat_(this, that);
};
Stream.prototype['+++'] = Stream.prototype.concat;

Stream.prototype.map = function (f) {
  return map_(this, f);
};

Stream.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};

Object.defineProperty(Stream.prototype, 'flatten', {
  get<F extends AnyK, A>(this: Stream<F, Stream<F, A>>): Stream<F, A> {
    return flatten(this);
  },
});

Object.defineProperty(Stream.prototype, 'compile', {
  get<A>(this: Stream<SyncIoK, A>): PureCompiler<A> {
    return compile(this);
  },
});

Stream.prototype.compileF = function (F) {
  return compileF(F)(this);
};
