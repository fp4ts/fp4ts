import { Kind, PrimitiveType } from '@fp4ts/core';
import {
  Applicative,
  Eq,
  Functor,
  MonadError,
  Monoid,
  MonoidK,
  Either,
  List,
  Option,
  Vector,
  Ior,
} from '@fp4ts/cats';
import { SyncIoK, Temporal } from '@fp4ts/effect';

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
  takeWhile_,
  dropWhile_,
  headOption,
  last,
  lastOption,
  init,
  filter_,
  filterNot_,
  collect_,
  collectWhile_,
  collectFirst_,
  fold_,
  foldMap_,
  foldMapK_,
  redeemWith_,
  chunkLimit_,
  chunkN_,
  unchunks,
  chunkMin_,
  scan_,
  scan1_,
  scanChunks_,
  scanChunksOpt_,
  zipAll_,
  zipAllWith_,
  zipWithIndex,
  mapAccumulate_,
  zipWithNext,
  zipWithPrevious,
  filterWithPrevious_,
  changes,
  sliding_,
  rethrow,
  evalMap_,
  evalMapChunk_,
  align_,
  evalTap_,
  attempts_,
  drain,
  evalCollect_,
  evalScan_,
  covary,
  covaryOutput,
  covaryAll,
} from './operators';
import { PureK } from '../pure';

declare module './algebra' {
  interface Stream<F, A> {
    readonly head: Stream<F, A>;
    readonly headOption: Stream<F, Option<A>>;
    readonly tail: Stream<F, A>;

    readonly last: Stream<F, A>;
    readonly lastOption: Stream<F, Option<A>>;
    readonly init: Stream<F, A>;

    readonly repeat: Stream<F, A>;
    readonly drain: Stream<F, never>;

    prepend<B>(this: Stream<F, B>, x: B): Stream<F, B>;
    prependChunk<B>(this: Stream<F, B>, x: Chunk<B>): Stream<F, B>;

    take(n: number): Stream<F, A>;
    takeRight(n: number): Stream<F, A>;
    takeWhile(pred: (a: A) => boolean, takeFailure?: boolean): Stream<F, A>;

    drop(n: number): Stream<F, A>;
    dropRight(n: number): Stream<F, A>;
    dropWhile(pred: (a: A) => boolean, dropFailure?: boolean): Stream<F, A>;

    concat<B>(this: Stream<F, B>, that: Stream<F, B>): Stream<F, B>;
    '+++'<B>(this: Stream<F, B>, that: Stream<F, B>): Stream<F, B>;

    readonly chunks: Stream<F, Chunk<A>>;
    readonly chunkAll: Stream<F, Chunk<A>>;
    chunkLimit(limit: number): Stream<F, Chunk<A>>;
    chunkMin(n: number, allowFewerTotal?: boolean): Stream<F, Chunk<A>>;
    chunkN(n: number, allowFewer?: boolean): Stream<F, Chunk<A>>;
    readonly unchunks: A extends Chunk<infer B> ? Stream<F, B> : never;
    sliding(size: number, step?: number): Stream<F, Chunk<A>>;

    changes(this: Stream<F, PrimitiveType>): Stream<F, A>;
    changes(E: Eq<A>): Stream<F, A>;

    filter(pred: (a: A) => boolean): Stream<F, A>;
    filterNot(pred: (a: A) => boolean): Stream<F, A>;

    filterWithPrevious(f: (prev: A, cur: A) => boolean): Stream<F, A>;

    collect<B>(f: (a: A) => Option<B>): Stream<F, B>;
    collectFirst<B>(f: (a: A) => Option<B>): Stream<F, B>;
    collectWhile<B>(f: (a: A) => Option<B>): Stream<F, B>;

    as<B>(result: B): Stream<F, B>;
    map<B>(f: (a: A) => B): Stream<F, B>;
    mapAccumulate<S>(s: S): <B>(f: (s: S, a: A) => [S, B]) => Stream<F, [S, B]>;
    evalMap<B>(f: (a: A) => Kind<F, [B]>): Stream<F, B>;
    evalCollect<B>(f: (a: A) => Kind<F, [Option<B>]>): Stream<F, B>;
    evalTap(F: Functor<F>): (f: (a: A) => Kind<F, [unknown]>) => Stream<F, A>;
    evalMapChunk(
      F: Applicative<F>,
    ): <B>(f: (a: A) => Kind<F, [B]>) => Stream<F, B>;

    flatMap<B>(f: (a: A) => Stream<F, B>): Stream<F, B>;
    readonly flatten: A extends Stream<F, infer B> ? Stream<F, B> : never;

    fold<B>(z: B, f: (b: B, a: A) => B): Stream<F, B>;
    foldMap<M>(M: Monoid<M>): (f: (a: A) => M) => Stream<F, M>;
    foldMapK<G>(
      G: MonoidK<G>,
    ): <B>(f: (a: A) => Kind<G, [B]>) => Stream<F, Kind<G, [B]>>;

    scan<B>(z: B, f: (b: B, a: A) => B): Stream<F, A>;
    scan1<B>(this: Stream<F, B>, f: (x: B, y: B) => B): Stream<F, B>;

    evalScan<B>(z: B, f: (b: B, a: A) => Kind<F, [B]>): Stream<F, B>;

    scanChunks<S, B>(
      s: S,
      f: (s: S, c: Chunk<A>) => [S, Chunk<B>],
    ): Stream<F, B>;
    scanChunksOpt<S, B>(
      s: S,
      f: (s: S) => Option<(c: Chunk<A>) => [S, Chunk<B>]>,
    ): Stream<F, B>;

    align<B>(that: Stream<F, B>): Stream<F, Ior<A, B>>;
    zip<B>(that: Stream<F, B>): Stream<F, [A, B]>;
    zipWith<B, C>(that: Stream<F, B>, f: (a: A, b: B) => C): Stream<F, C>;

    readonly zipWithIndex: Stream<F, [A, number]>;
    readonly zipWithNext: Stream<F, [A, Option<A>]>;
    readonly zipWithPrevious: Stream<F, [Option<A>, A]>;

    zipAll<AA, B>(
      this: Stream<F, AA>,
      that: Stream<F, B>,
    ): (pad1: AA, pad2: B) => Stream<F, [AA, B]>;
    zipAllWith<AA, B>(
      this: Stream<F, AA>,
      that: Stream<F, B>,
    ): (pad1: AA, pad2: B) => <C>(f: (a: AA, b: B) => C) => Stream<F, C>;

    readonly attempt: Stream<F, Either<Error, A>>;
    attempts<F>(
      F: Temporal<F, Error>,
    ): (delays: Stream<F, number>) => Stream<F, Either<Error, A>>;

    redeemWith<B>(
      onFailure: (e: Error) => Stream<F, B>,
      onSuccess: (a: A) => Stream<F, B>,
    ): Stream<F, B>;

    rethrow: A extends Either<Error, infer B> ? Stream<F, B> : never;

    handleErrorWith<B>(
      this: Stream<F, B>,
      h: (e: Error) => Stream<F, B>,
    ): Stream<F, B>;

    covary<F2>(this: Stream<F2, A>): Stream<F2, A>;
    covaryOutput<B>(this: Stream<F, B>): Stream<F, B>;
    covaryAll<F2, B>(this: Stream<F2, B>): Stream<F2, B>;

    compile: F extends PureK ? PureCompiler<A> : never;
    compileF(F: MonadError<F, Error>): Compiler<F, A>;

    toList: F extends PureK ? List<A> : never;
    toVector: F extends PureK ? Vector<A> : never;
  }
}

Object.defineProperty(Stream.prototype, 'head', {
  get<F, A>(this: Stream<F, A>): Stream<F, A> {
    return head(this);
  },
});
Object.defineProperty(Stream.prototype, 'headOption', {
  get<F, A>(this: Stream<F, A>): Stream<F, Option<A>> {
    return headOption(this);
  },
});

Object.defineProperty(Stream.prototype, 'tail', {
  get<F, A>(this: Stream<F, A>): Stream<F, A> {
    return tail(this);
  },
});

Object.defineProperty(Stream.prototype, 'last', {
  get<F, A>(this: Stream<F, A>): Stream<F, A> {
    return last(this);
  },
});
Object.defineProperty(Stream.prototype, 'lastOption', {
  get<F, A>(this: Stream<F, A>): Stream<F, Option<A>> {
    return lastOption(this);
  },
});

Object.defineProperty(Stream.prototype, 'init', {
  get<F, A>(this: Stream<F, A>): Stream<F, A> {
    return init(this);
  },
});

Object.defineProperty(Stream.prototype, 'repeat', {
  get<F, A>(this: Stream<F, A>): Stream<F, A> {
    return repeat(this);
  },
});

Object.defineProperty(Stream.prototype, 'drain', {
  get<F, A>(this: Stream<F, A>): Stream<F, never> {
    return drain(this);
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
Stream.prototype.takeWhile = function (pred, takeFailure) {
  return takeWhile_(this, pred, takeFailure);
};

Stream.prototype.drop = function (n) {
  return drop_(this, n);
};
Stream.prototype.dropRight = function (n) {
  return dropRight_(this, n);
};
Stream.prototype.dropWhile = function (pred, dropFailure) {
  return dropWhile_(this, pred, dropFailure);
};

Stream.prototype.concat = function (that) {
  return concat_(this, that);
};
Stream.prototype['+++'] = Stream.prototype.concat;

Object.defineProperty(Stream.prototype, 'chunks', {
  get<F, A>(this: Stream<F, A>): Stream<F, Chunk<A>> {
    return chunks(this);
  },
});

Object.defineProperty(Stream.prototype, 'chunkAll', {
  get<F, A>(this: Stream<F, A>): Stream<F, Chunk<A>> {
    return chunkAll(this);
  },
});

Stream.prototype.chunkLimit = function (limit) {
  return chunkLimit_(this, limit);
};

Stream.prototype.chunkMin = function (n, allowFewerTotal) {
  return chunkMin_(this, n, allowFewerTotal);
};

Stream.prototype.chunkN = function (n, allowFewer) {
  return chunkN_(this, n, allowFewer);
};

Object.defineProperty(Stream.prototype, 'unchunks', {
  get<F, A>(this: Stream<F, Chunk<A>>): Stream<F, A> {
    return unchunks(this);
  },
});

Stream.prototype.sliding = function (size, step) {
  return sliding_(this, size, step);
};

Stream.prototype.changes = function (E = Eq.primitive) {
  return changes(E as Eq<any>)(this);
};

Stream.prototype.filter = function (pred) {
  return filter_(this, pred);
};
Stream.prototype.filterNot = function (pred) {
  return filterNot_(this, pred);
};
Stream.prototype.filterWithPrevious = function (f) {
  return filterWithPrevious_(this, f);
};
Stream.prototype.collect = function (f) {
  return collect_(this, f);
};
Stream.prototype.collectFirst = function (f) {
  return collectFirst_(this, f);
};
Stream.prototype.collectWhile = function (f) {
  return collectWhile_(this, f);
};

Stream.prototype.as = function (r) {
  return map_(this, () => r);
};

Stream.prototype.map = function (f) {
  return map_(this, f);
};

Stream.prototype.mapAccumulate = function (s) {
  return f => mapAccumulate_(this, s, f);
};

Stream.prototype.evalMap = function (f) {
  return evalMap_(this, f);
};
Stream.prototype.evalCollect = function (f) {
  return evalCollect_(this, f);
};
Stream.prototype.evalTap = function (F) {
  return f => evalTap_(F)(this, f);
};

Stream.prototype.evalMapChunk = function (F) {
  return f => evalMapChunk_(F)(this, f);
};

Stream.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};

Object.defineProperty(Stream.prototype, 'flatten', {
  get<F, A>(this: Stream<F, Stream<F, A>>): Stream<F, A> {
    return flatten(this);
  },
});

Stream.prototype.fold = function (z, f) {
  return fold_(this, z, f);
};

Stream.prototype.foldMap = function (M) {
  return f => foldMap_(M)(this, f);
};

Stream.prototype.foldMapK = function (G) {
  return f => foldMapK_(G)(this, f);
};

Stream.prototype.scan = function (z, f) {
  return scan_(this, z, f);
};

Stream.prototype.scan1 = function (f) {
  return scan1_(this, f);
};

Stream.prototype.evalScan = function (z, f) {
  return evalScan_(this, z, f);
};

Stream.prototype.scanChunks = function (init, f) {
  return scanChunks_(this, init, f);
};

Stream.prototype.scanChunksOpt = function (init, f) {
  return scanChunksOpt_(this, init, f);
};

Stream.prototype.align = function (that) {
  return align_(this, that);
};

Stream.prototype.zip = function (that) {
  return zip_(this, that);
};

Stream.prototype.zipWith = function (that, f) {
  return zipWith_(this, that)(f);
};

Object.defineProperty(Stream.prototype, 'zipWithIndex', {
  get<F, A>(this: Stream<F, A>): Stream<F, [A, number]> {
    return zipWithIndex(this);
  },
});

Object.defineProperty(Stream.prototype, 'zipWithNext', {
  get<F, A>(this: Stream<F, A>): Stream<F, [A, Option<A>]> {
    return zipWithNext(this);
  },
});

Object.defineProperty(Stream.prototype, 'zipWithPrevious', {
  get<F, A>(this: Stream<F, A>): Stream<F, [Option<A>, A]> {
    return zipWithPrevious(this);
  },
});

Stream.prototype.zipAll = function (that) {
  return (pad1, pad2) => zipAll_(this, that, pad1, pad2);
};

Stream.prototype.zipAllWith = function (that) {
  return (pad1, pad2) => zipAllWith_(this, that, pad1, pad2);
};

Object.defineProperty(Stream.prototype, 'attempt', {
  get<F, A>(this: Stream<F, A>): Stream<F, Either<Error, A>> {
    return attempt(this);
  },
});

Stream.prototype.attempts = function (F) {
  return delays => attempts_(F)(this, delays);
};

Stream.prototype.redeemWith = function (h, f) {
  return redeemWith_(this, h, f);
};

Object.defineProperty(Stream.prototype, 'rethrow', {
  get<F, A>(this: Stream<F, Either<Error, A>>): Stream<F, A> {
    return rethrow(this);
  },
});

Stream.prototype.handleErrorWith = function (h) {
  return handleErrorWith_(this, h);
};

Stream.prototype.covary = function () {
  return covary()(this) as any;
};
Stream.prototype.covaryOutput = function () {
  return covaryOutput()(this) as any;
};
Stream.prototype.covaryAll = function () {
  return covaryAll()(this) as any;
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
  get<A>(this: Stream<PureK, A>): List<A> {
    return this.compile.toList;
  },
});

Object.defineProperty(Stream.prototype, 'toVector', {
  get<A>(this: Stream<PureK, A>): Vector<A> {
    return this.compile.toVector;
  },
});
