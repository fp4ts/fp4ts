import { MonadError } from '@cats4ts/cats-core';
import { Either, List, Vector } from '@cats4ts/cats-core/lib/data';
import { AnyK } from '@cats4ts/core';
import { SyncIoK } from '@cats4ts/effect-core';

import { Chunk } from '../chunk';
import { Stream } from './algebra';
import { Compiler, PureCompiler } from './compiler';
import {
  concat_,
  map_,
  flatMap_,
  flatten,
  compileF,
  compile,
  take_,
  prepend_,
  prependChunk_,
  head,
  drop_,
  tail,
  zip_,
  zipWith_,
  repeat,
  handleErrorWith_,
  attempt,
  chunks,
  chunkAll,
  takeRight_,
  dropRight_,
} from './operators';

declare module './algebra' {
  interface Stream<F extends AnyK, A> {
    readonly head: Stream<F, A>;
    readonly tail: Stream<F, A>;

    readonly repeat: Stream<F, A>;

    prepend<B>(this: Stream<F, B>, x: B): Stream<F, B>;
    prependChunk<B>(this: Stream<F, B>, x: Chunk<B>): Stream<F, B>;

    take(n: number): Stream<F, A>;
    takeRight(n: number): Stream<F, A>;
    drop(n: number): Stream<F, A>;
    dropRight(n: number): Stream<F, A>;

    concat<B>(this: Stream<F, B>, that: Stream<F, B>): Stream<F, B>;
    '+++'<B>(this: Stream<F, B>, that: Stream<F, B>): Stream<F, B>;

    readonly attempt: Stream<F, Either<Error, A>>;

    handleErrorWith<B>(
      this: Stream<F, B>,
      h: (e: Error) => Stream<F, B>,
    ): Stream<F, B>;

    readonly chunks: Stream<F, Chunk<A>>;
    readonly chunkAll: Stream<F, Chunk<A>>;

    as<B>(result: B): Stream<F, B>;
    map<B>(f: (a: A) => B): Stream<F, B>;

    flatMap<B>(f: (a: A) => Stream<F, B>): Stream<F, B>;

    readonly flatten: A extends Stream<F, infer B> ? Stream<F, B> : never;

    zip<B>(that: Stream<F, B>): Stream<F, [A, B]>;
    zipWith<B, C>(that: Stream<F, B>, f: (a: A, b: B) => C): Stream<F, C>;

    compile: F extends SyncIoK ? PureCompiler<A> : never;
    compileF(F: MonadError<F, Error>): Compiler<F, A>;

    toList: F extends SyncIoK ? List<A> : never;
    toVector: F extends SyncIoK ? Vector<A> : never;
  }
}

Object.defineProperty(Stream.prototype, 'head', {
  get<F extends AnyK, A>(this: Stream<F, A>): Stream<F, A> {
    return head(this);
  },
});

Object.defineProperty(Stream.prototype, 'tail', {
  get<F extends AnyK, A>(this: Stream<F, A>): Stream<F, A> {
    return tail(this);
  },
});

Object.defineProperty(Stream.prototype, 'repeat', {
  get<F extends AnyK, A>(this: Stream<F, A>): Stream<F, A> {
    return repeat(this);
  },
});

Stream.prototype.prepend = function (x) {
  return prepend_(this, x);
};

Stream.prototype.prependChunk = function (c) {
  return prependChunk_(this, c);
};

Stream.prototype.take = function (n) {
  return take_(this, n);
};
Stream.prototype.takeRight = function (n) {
  return takeRight_(this, n);
};

Stream.prototype.drop = function (n) {
  return drop_(this, n);
};

Stream.prototype.dropRight = function (n) {
  return dropRight_(this, n);
};

Stream.prototype.concat = function (that) {
  return concat_(this, that);
};
Stream.prototype['+++'] = Stream.prototype.concat;

Stream.prototype.as = function (r) {
  return map_(this, () => r);
};

Object.defineProperty(Stream.prototype, 'attempt', {
  get<F extends AnyK, A>(this: Stream<F, A>): Stream<F, Either<Error, A>> {
    return attempt(this);
  },
});

Stream.prototype.handleErrorWith = function (h) {
  return handleErrorWith_(this, h);
};

Object.defineProperty(Stream.prototype, 'chunks', {
  get<F extends AnyK, A>(this: Stream<F, A>): Stream<F, Chunk<A>> {
    return chunks(this);
  },
});

Object.defineProperty(Stream.prototype, 'chunkAll', {
  get<F extends AnyK, A>(this: Stream<F, A>): Stream<F, Chunk<A>> {
    return chunkAll(this);
  },
});

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

Stream.prototype.zip = function (that) {
  return zip_(this, that);
};

Stream.prototype.zipWith = function (that, f) {
  return zipWith_(this, that)(f);
};

Object.defineProperty(Stream.prototype, 'compile', {
  get<A>(this: Stream<SyncIoK, A>): PureCompiler<A> {
    return compile(this);
  },
});

Stream.prototype.compileF = function (F) {
  return compileF(F)(this);
};

Object.defineProperty(Stream.prototype, 'toList', {
  get<A>(this: Stream<AnyK, A>): List<A> {
    return this.compile.toList;
  },
});

Object.defineProperty(Stream.prototype, 'toVector', {
  get<A>(this: Stream<AnyK, A>): Vector<A> {
    return this.compile.toVector;
  },
});
