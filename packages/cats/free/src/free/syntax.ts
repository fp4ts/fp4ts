import { AnyK, Kind } from '@cats4ts/core';
import { FunctionK, Monad } from '@cats4ts/cats-core';
import { Free } from './algebra';
import { flatMap_, map_, mapK_ } from './operators';

declare module './algebra' {
  interface Free<F extends AnyK, A> {
    map<B>(f: (a: A) => B): Free<F, B>;

    flatMap<B>(this: Free<F, A>, f: (a: A) => Free<F, B>): Free<F, B>;

    mapK<G extends AnyK>(G: Monad<G>): (nt: FunctionK<F, G>) => Kind<G, [A]>;
  }
}

Free.prototype.map = function (f) {
  return map_(this, f);
};

Free.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};

Free.prototype.mapK = function (G) {
  return nt => mapK_(G)(this, nt);
};
