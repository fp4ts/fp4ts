import { FunctionK, Monad } from '../../cats';
import { Intro, Kind, Mix, URIS } from '../../core';
import { Free } from './algebra';
import { flatMap_, map_, mapK_ } from './operators';

declare module './algebra' {
  interface Free<F, C, S, R, E, A> {
    map<B>(f: (a: A) => B): Free<F, C, S, R, E, B>;

    flatMap<S2, R2, E2, B>(
      this: Free<
        F,
        C,
        Intro<C, 'S', S2, S>,
        Intro<C, 'R', R2, R>,
        Intro<C, 'E', E2, E>,
        A
      >,
      f: (a: A) => Free<F, C, S2, R2, E2, B>,
    ): Free<
      F,
      C,
      Mix<C, 'S', [S2, S]>,
      Mix<C, 'R', [R2, R]>,
      Mix<C, 'E', [E2, E]>,
      B
    >;

    mapK<G extends URIS, CG>(
      G: Monad<G, CG>,
    ): (nt: FunctionK<F, G, C, CG>) => Kind<G, CG, S, R, E, A>;
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
