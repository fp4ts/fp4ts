import { Kind } from '@fp4ts/core';
import {
  Option,
  FunctionK,
  IdentityK,
  Applicative,
  MonadError,
} from '@fp4ts/cats';

import { Scope } from '../internal';
import { Pull } from './algebra';
import {
  flatMap_,
  handleErrorWith_,
  map_,
  onComplete_,
  toVoid,
} from './operators';
import { Chunk } from '../chunk';
import {
  compile_,
  cons,
  dropWhile_,
  drop_,
  find_,
  flatMapOutput_,
  fold_,
  last,
  mapOutput_,
  scanChunksOpt_,
  scanChunks_,
  takeRight_,
  takeWhile_,
  take_,
  translate_,
  uncons,
  uncons1,
  unconsLimit_,
  unconsN_,
} from './stream-projection';

declare module './algebra' {
  interface Pull<F, O, R> {
    cons<O2>(this: Pull<F, O2, void>, c: Chunk<O2>): Pull<F, O2, void>;

    readonly uncons: R extends void
      ? Pull<F, never, Option<[Chunk<O>, Pull<F, O, void>]>>
      : never;

    readonly uncons1: R extends void
      ? Pull<F, never, Option<[O, Pull<F, O, void>]>>
      : never;

    unconsN(
      this: Pull<F, O, void>,
      n: number,
      allowFewer?: boolean,
    ): Pull<F, never, Option<[Chunk<O>, Pull<F, O, void>]>>;

    unconsLimit(
      this: Pull<F, O, void>,
      limit: number,
    ): Pull<F, never, Option<[Chunk<O>, Pull<F, O, void>]>>;

    readonly last: R extends void ? Pull<F, never, Option<O>> : never;

    take(
      this: Pull<F, O, void>,
      n: number,
    ): Pull<F, O, Option<Pull<F, O, void>>>;
    takeRight(this: Pull<F, O, void>, n: number): Pull<F, never, Chunk<O>>;
    takeWhile(
      this: Pull<F, O, void>,
      pred: (o: O) => boolean,
      takeFailure?: boolean,
    ): Pull<F, O, Option<Pull<F, O, void>>>;

    drop(
      this: Pull<F, O, void>,
      n: number,
    ): Pull<F, never, Option<Pull<F, O, void>>>;
    dropWhile(
      this: Pull<F, O, void>,
      pred: (o: O) => boolean,
      dropFailure?: boolean,
    ): Pull<F, never, Option<Pull<F, O, void>>>;

    find(
      this: Pull<F, O, void>,
      pred: (o: O) => boolean,
    ): Pull<F, never, Option<[O, Pull<F, O, void>]>>;

    mapOutput<O2, P>(
      this: Pull<F, O2, void>,
      f: (o: O2) => P,
    ): Pull<F, P, void>;

    flatMapOutput<O2, P>(
      this: Pull<F, O2, void>,
      f: (o: O2) => Pull<F, P, void>,
    ): Pull<F, P, void>;

    translate<G>(this: Pull<F, O, void>, nt: FunctionK<F, G>): Pull<G, O, void>;

    readonly void: Pull<F, O, void>;

    map<X, R2>(this: Pull<F, O, X>, f: (r: X) => R2): Pull<F, O, R2>;

    flatMap<O2, X, R2>(
      this: Pull<F, O2, X>,
      f: (r: X) => Pull<F, O2, R2>,
    ): Pull<F, O2, R2>;
    '>>>'<O2, X, R2>(
      this: Pull<F, O2, X>,
      f: () => Pull<F, O2, R2>,
    ): Pull<F, O2, R2>;

    handleErrorWith<O2, R2>(
      this: Pull<F, O2, R2>,
      h: (e: Error) => Pull<F, O2, R2>,
    ): Pull<F, O2, R2>;

    onComplete<O2, R2>(
      this: Pull<F, O2, R2>,
      post: () => Pull<F, O2, R2>,
    ): Pull<F, O2, R2>;

    fold<P>(
      this: Pull<F, O, void>,
      z: P,
      f: (p: P, o: O) => P,
    ): Pull<F, never, P>;

    scanChunks<S, O2>(
      this: Pull<F, O, void>,
      s: S,
      f: (s: S, o: Chunk<O>) => [S, Chunk<O2>],
    ): Pull<F, O2, S>;
    scanChunksOpt<S, OO, O2>(
      this: Pull<F, OO, void>,
      s: S,
      f: (s: S) => Option<(o: Chunk<OO>) => [S, Chunk<O2>]>,
    ): Pull<F, O2, S>;

    covaryId<G>(this: Pull<IdentityK, O, R>, G: Applicative<G>): Pull<G, O, R>;

    compile<F2, O2>(
      this: Pull<F2, O2, void>,
      F: MonadError<F2, Error>,
    ): <B>(
      init: B,
      initScope: Scope<F2>,
      foldChunk: (b: B, chunk: Chunk<O2>) => B,
    ) => Kind<F2, [B]>;
  }
}

Pull.prototype.cons = function (c) {
  return cons(c, this);
};

Object.defineProperty(Pull.prototype, 'uncons', {
  get<F, O>(
    this: Pull<F, O, void>,
  ): Pull<F, never, Option<[Chunk<O>, Pull<F, O, void>]>> {
    return uncons(this);
  },
});

Object.defineProperty(Pull.prototype, 'uncons1', {
  get<F, O>(
    this: Pull<F, O, void>,
  ): Pull<F, never, Option<[O, Pull<F, O, void>]>> {
    return uncons1(this);
  },
});

Pull.prototype.unconsN = function (n, allowFewer) {
  return unconsN_(this, n, allowFewer);
};

Pull.prototype.unconsLimit = function (limit) {
  return unconsLimit_(this, limit);
};

Object.defineProperty(Pull.prototype, 'last', {
  get<F, O>(this: Pull<F, O, void>): Pull<F, never, Option<O>> {
    return last(this);
  },
});

Pull.prototype.take = function (n) {
  return take_(this, n);
};
Pull.prototype.takeRight = function (n) {
  return takeRight_(this, n);
};
Pull.prototype.takeWhile = function (pred, takeFailure) {
  return takeWhile_(this, pred, takeFailure);
};

Pull.prototype.drop = function (n) {
  return drop_(this, n);
};
Pull.prototype.dropWhile = function (pred, dropFailure) {
  return dropWhile_(this, pred, dropFailure);
};

Pull.prototype.find = function (pred) {
  return find_(this, pred);
};

Pull.prototype.mapOutput = function (f) {
  return mapOutput_(this, f);
};

Pull.prototype.flatMapOutput = function (f) {
  return flatMapOutput_(this, f);
};

Pull.prototype.translate = function (nt) {
  return translate_(this, nt);
};

Object.defineProperty(Pull.prototype, 'void', {
  get<F, O, R>(this: Pull<F, O, R>): Pull<F, O, void> {
    return toVoid(this);
  },
});

Pull.prototype.map = function (f) {
  return map_(this, f);
};

Pull.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};
Pull.prototype['>>>'] = function (f) {
  return flatMap_(this, f);
};

Pull.prototype.handleErrorWith = function (h) {
  return handleErrorWith_(this, h);
};

Pull.prototype.onComplete = function (post) {
  return onComplete_(this, post);
};

Pull.prototype.fold = function (z, f) {
  return fold_(this, z, f);
};

Pull.prototype.scanChunks = function (s, f) {
  return scanChunks_(this, s, f);
};

Pull.prototype.scanChunksOpt = function (s, f) {
  return scanChunksOpt_(this, s, f);
};

Pull.prototype.covaryId = function (G) {
  return translate_(this, G.pure);
};

Pull.prototype.compile = function (F) {
  return (init, initScope, foldChunk) =>
    compile_(F)(this, init, initScope, foldChunk);
};
