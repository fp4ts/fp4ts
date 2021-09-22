import { AnyK, Kind } from '@cats4ts/core';
import { Either, Option } from '@cats4ts/cats-core/lib/data';
import { Pull } from './algebra';
import {
  attempt,
  flatMap_,
  handleErrorWith_,
  map_,
  onComplete_,
} from './operators';
import { Chunk } from '../chunk';
import { FunctionK, MonadError } from '@cats4ts/cats-core';
import {
  compile_,
  flatMapOutput_,
  mapOutput_,
  translate_,
  uncons,
} from './stream-projection';

export {};

declare module './algebra' {
  interface Pull<F extends AnyK, O, R> {
    readonly uncons: R extends void
      ? Pull<F, never, Option<[Chunk<O>, Pull<F, O, void>]>>
      : never;

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

    map<X, R2>(this: Pull<F, O, X>, f: (r: X) => R2): Pull<F, O, R2>;

    flatMap<O2, X, R2>(
      this: Pull<F, O2, X>,
      f: (r: X) => Pull<F, O2, R2>,
    ): Pull<F, O2, R2>;

    handleErrorWith<O2, R2>(
      this: Pull<F, O2, R2>,
      h: (e: Error) => Pull<F, O2, R2>,
    ): Pull<F, O2, R2>;

    readonly attempt: Pull<F, O, Either<Error, R>>;

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

Pull.prototype.mapOutput = function (f) {
  return mapOutput_(this, f);
};

Pull.prototype.flatMapOutput = function (f) {
  return flatMapOutput_(this, f);
};

Pull.prototype.translate = function (nt) {
  return translate_(this, nt);
};

Pull.prototype.map = function (f) {
  return map_(this, f);
};

Pull.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};

Pull.prototype.handleErrorWith = function (h) {
  return handleErrorWith_(this, h);
};

Object.defineProperty(Pull.prototype, 'attempt', {
  get<F extends AnyK, O, R>(this: Pull<F, O, R>): Pull<F, O, Either<Error, R>> {
    return attempt(this);
  },
});

Pull.prototype.onComplete = function (post) {
  return onComplete_(this, post);
};

Pull.prototype.compile = function (F) {
  return (init, foldChunk) => compile_(F)(this, init, foldChunk);
};
