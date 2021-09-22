import { Either } from '@cats4ts/cats-core/lib/data';
import { SyncIO } from './algebra';
import {
  attempt,
  flatMap_,
  handleErrorWith_,
  map_,
  unsafeRunSync,
} from './operators';

declare module './algebra' {
  interface SyncIO<A> {
    map<B>(f: (a: A) => B): SyncIO<B>;
    flatMap<B>(f: (a: A) => SyncIO<B>): SyncIO<B>;
    handleErrorWith<B>(this: SyncIO<B>, h: (e: Error) => SyncIO<B>): SyncIO<B>;
    readonly attempt: SyncIO<Either<Error, A>>;
    unsafeRunSync(): A;
  }
}

SyncIO.prototype.map = function (f) {
  return map_(this, f);
};

SyncIO.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};

SyncIO.prototype.handleErrorWith = function (h) {
  return handleErrorWith_(this, h);
};

Object.defineProperty(SyncIO.prototype, 'attempt', {
  get<A>(this: SyncIO<A>): SyncIO<Either<Error, A>> {
    return attempt(this);
  },
});

SyncIO.prototype.unsafeRunSync = function () {
  return unsafeRunSync(this);
};
