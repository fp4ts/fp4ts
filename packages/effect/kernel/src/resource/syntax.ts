// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind } from '@fp4ts/core';
import { Monoid, ApplicativeError, Either, Kleisli } from '@fp4ts/cats';

import { MonadCancel } from '../monad-cancel';
import { Concurrent } from '../concurrent';
import { Outcome } from '../outcome';
import { Fiber } from '../fiber';
import { Resource } from './algebra';
import { ResourceK } from './resource';
import {
  allocated,
  attempt,
  both_,
  combine_,
  evalMap_,
  evalTap_,
  finalize_,
  flatMap_,
  flatten,
  fold_,
  fork,
  handleErrorWith_,
  handleError_,
  map_,
  onCancel_,
  race_,
  surround_,
  useKleisli_,
  use_,
} from './operators';

declare module './algebra' {
  interface Resource<F, A> {
    use(
      F: MonadCancel<F, Error>,
    ): <B>(f: (a: A) => Kind<F, [B]>) => Kind<F, [B]>;
    use_(F: MonadCancel<F, Error>): Kind<F, [void]>;

    useKleisli(
      F: MonadCancel<F, Error>,
    ): <B>(k: Kleisli<F, A, B>) => Kind<F, [B]>;

    surround(F: MonadCancel<F, Error>): <B>(fb: Kind<F, [B]>) => Kind<F, [B]>;

    map<B>(f: (a: A) => B): Resource<F, B>;
    evalMap<B>(f: (a: A) => Kind<F, [B]>): Resource<F, B>;
    evalTap(f: (a: A) => Kind<F, [unknown]>): Resource<F, A>;

    flatMap<B>(f: (a: A) => Resource<F, B>): Resource<F, B>;
    readonly flatten: A extends Resource<F, infer B> ? Resource<F, B> : never;

    '>>>'<B>(that: Resource<F, B>): Resource<F, B>;
    '<<<'<B>(that: Resource<F, B>): Resource<F, B>;

    combine<B>(
      this: Resource<F, B>,
      A: Monoid<B>,
    ): (that: Resource<F, B>) => Resource<F, B>;

    handleError<B>(
      this: Resource<F, B>,
      F: ApplicativeError<F, Error>,
    ): (h: (e: Error) => B) => Resource<F, B>;
    handleErrorWith<B>(
      this: Resource<F, B>,
      F: ApplicativeError<F, Error>,
    ): (h: (e: Error) => Resource<F, B>) => Resource<F, B>;

    attempt(F: ApplicativeError<F, Error>): Resource<F, Either<Error, A>>;

    onCancel(
      F: MonadCancel<F, Error>,
    ): (fin: Resource<F, void>) => Resource<F, A>;
    finalize(
      F: MonadCancel<F, Error>,
    ): (
      fin: (oc: Outcome<$<ResourceK, [F]>, Error, A>) => Resource<F, void>,
    ) => Resource<F, A>;

    both(
      F: Concurrent<F, Error>,
    ): <B>(that: Resource<F, B>) => Resource<F, [A, B]>;
    race(
      F: Concurrent<F, Error>,
    ): <B>(that: Resource<F, B>) => Resource<F, Either<A, B>>;
    fork(
      F: Concurrent<F, Error>,
    ): Resource<F, Fiber<$<ResourceK, [F]>, Error, A>>;

    allocated(F: MonadCancel<F, Error>): Kind<F, [[A, Kind<F, [void]>]]>;
    fold(
      F: MonadCancel<F, Error>,
    ): <B>(
      onOutput: (a: A) => Kind<F, [B]>,
    ) => (onRelease: (fv: Kind<F, [void]>) => Kind<F, [void]>) => Kind<F, [B]>;
  }
}

Resource.prototype.use = function (F) {
  return f => use_(F)(this, f);
};
Resource.prototype.use_ = function (F) {
  return use_(F)(this, () => F.unit);
};
Resource.prototype.useKleisli = function (F) {
  return k => useKleisli_(F)(this, k);
};

Resource.prototype.surround = function (F) {
  return fb => surround_(F)(this, fb);
};

Resource.prototype.map = function (f) {
  return map_(this, f);
};
Resource.prototype.evalMap = function (f) {
  return evalMap_(this, f);
};
Resource.prototype.evalTap = function (f) {
  return evalTap_(this, f);
};
Resource.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};

Object.defineProperty(Resource.prototype, 'flatten', {
  get<F, A>(this: Resource<F, Resource<F, A>>): Resource<F, A> {
    return flatten(this);
  },
});

Resource.prototype['>>>'] = function (that) {
  return this.flatMap(() => that);
};

Resource.prototype['<<<'] = function (that) {
  return this.flatMap(a => that.map(() => a));
};

Resource.prototype.combine = function (A) {
  return that => combine_(A)(this, that);
};

Resource.prototype.handleError = function (F) {
  return h => handleError_(F)(this, h);
};
Resource.prototype.handleErrorWith = function (F) {
  return h => handleErrorWith_(F)(this, h);
};
Resource.prototype.attempt = function (F) {
  return attempt(F)(this);
};

Resource.prototype.onCancel = function (F) {
  return fin => onCancel_(F)(this, fin);
};
Resource.prototype.finalize = function (F) {
  return fin => finalize_(F)(this, fin);
};

Resource.prototype.both = function (F) {
  return that => both_(F)(this, that);
};
Resource.prototype.race = function (F) {
  return that => race_(F)(this, that);
};
Resource.prototype.fork = function (F) {
  return fork(F)(this);
};

Resource.prototype.allocated = function (F) {
  return allocated(F)(this);
};
Resource.prototype.fold = function (F) {
  return onOutput => onRelease => fold_(F)(this, onOutput, onRelease);
};
