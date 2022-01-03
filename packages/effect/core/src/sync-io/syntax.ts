// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either } from '@fp4ts/cats';
import { SyncIO } from './algebra';
import {
  attempt,
  flatMap_,
  handleErrorWith_,
  handleError_,
  map_,
  redeemWith_,
  redeem_,
  unsafeRunSync,
} from './operators';

declare module './algebra' {
  interface SyncIO<A> {
    readonly void: SyncIO<void>;

    readonly attempt: SyncIO<Either<Error, A>>;
    redeem<B>(onFailure: (e: Error) => B, onSuccess: (a: A) => B): SyncIO<B>;
    redeemWith<B>(
      onFailure: (e: Error) => SyncIO<B>,
      onSuccess: (a: A) => SyncIO<B>,
    ): SyncIO<B>;

    handleError<B>(this: SyncIO<B>, h: (e: Error) => B): SyncIO<B>;
    handleErrorWith<B>(this: SyncIO<B>, h: (e: Error) => SyncIO<B>): SyncIO<B>;

    map<B>(f: (a: A) => B): SyncIO<B>;

    flatMap<B>(f: (a: A) => SyncIO<B>): SyncIO<B>;

    unsafeRunSync(): A;
  }
}

Object.defineProperty(SyncIO.prototype, 'void', {
  get<A>(this: SyncIO<A>): SyncIO<void> {
    return map_(this, () => undefined);
  },
});

Object.defineProperty(SyncIO.prototype, 'attempt', {
  get<A>(this: SyncIO<A>): SyncIO<Either<Error, A>> {
    return attempt(this);
  },
});

SyncIO.prototype.redeem = function (h, f) {
  return redeem_(this, h, f);
};

SyncIO.prototype.redeemWith = function (h, f) {
  return redeemWith_(this, h, f);
};

SyncIO.prototype.map = function (f) {
  return map_(this, f);
};

SyncIO.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};

SyncIO.prototype.handleError = function (h) {
  return handleError_(this, h);
};

SyncIO.prototype.handleErrorWith = function (h) {
  return handleErrorWith_(this, h);
};

SyncIO.prototype.unsafeRunSync = function () {
  return unsafeRunSync(this);
};
