import { AnyK, Kind } from '@cats4ts/core';
import { Option } from '@cats4ts/cats-core/lib/data';
import { Pull } from './algebra';
import {
  flatMap_,
  handleErrorWith_,
  map_,
  onComplete_,
  toVoid,
} from './operators';
import { Chunk } from '../chunk';
import { FunctionK, MonadError } from '@cats4ts/cats-core';
import {
  compile_,
  drop_,
  flatMapOutput_,
  mapOutput_,
  takeRight_,
  take_,
  translate_,
  uncons,
  unconsN_,
} from './stream-projection';

declare module './algebra' {
  interface Pull<F extends AnyK, O, R> {
    readonly uncons: R extends void
      ? Pull<F, never, Option<[Chunk<O>, Pull<F, O, void>]>>
      : never;

    unconsN(
      this: Pull<F, O, void>,
      n: number,
      allowFewer?: boolean,
    ): Pull<F, never, Option<[Chunk<O>, Pull<F, O, void>]>>;

    take(
      this: Pull<F, O, void>,
      n: number,
    ): Pull<F, O, Option<Pull<F, O, void>>>;
    takeRight(this: Pull<F, O, void>, n: number): Pull<F, never, Chunk<O>>;

    drop(
      this: Pull<F, O, void>,
      n: number,
    ): Pull<F, never, Option<Pull<F, O, void>>>;

    mapOutput<O2, P>(
      this: Pull<F, O2, void>,
      f: (o: O2) => P,
    ): Pull<F, P, void>;

    flatMapOutput<O2, P>(
      this: Pull<F, O2, void>,
      f: (o: O2) => Pull<F, P, void>,
    ): Pull<F, P, void>;

    translate<G extends AnyK>(
      this: Pull<F, O, void>,
      nt: FunctionK<F, G>,
    ): Pull<G, O, void>;

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

    compile<O2>(
      this: Pull<F, O2, void>,
      F: MonadError<F, Error>,
    ): <B>(init: B, foldChunk: (b: B, chunk: Chunk<O2>) => B) => Kind<F, [B]>;
  }
}

Object.defineProperty(Pull.prototype, 'uncons', {
  get<F extends AnyK, O>(
    this: Pull<F, O, void>,
  ): Pull<F, never, Option<[Chunk<O>, Pull<F, O, void>]>> {
    return uncons(this);
  },
});

Pull.prototype.unconsN = function (n, allowFewer) {
  return unconsN_(this, n, allowFewer);
};

Pull.prototype.take = function (n) {
  return take_(this, n);
};

Pull.prototype.takeRight = function (n) {
  return takeRight_(this, n);
};

Pull.prototype.drop = function (n) {
  return drop_(this, n);
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
  get<F extends AnyK, O, R>(this: Pull<F, O, R>): Pull<F, O, void> {
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

Pull.prototype.compile = function (F) {
  return (init, foldChunk) => compile_(F)(this, init, foldChunk);
};
