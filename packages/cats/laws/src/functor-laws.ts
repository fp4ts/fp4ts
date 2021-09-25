import { AnyK, compose, id, Kind, pipe } from '@cats4ts/core';
import { Functor } from '@cats4ts/cats-core';

import { IsEq } from './results';

export class FunctorLaws<F extends AnyK, T extends Functor<F> = Functor<F>> {
  public constructor(readonly F: T) {}

  public readonly covariantIdentity = <A>(
    fa: Kind<F, [A]>,
  ): IsEq<Kind<F, [A]>> => {
    const { F } = this;
    return F.map_(fa, id)['<=>'](fa);
  };

  public readonly covariantComposition = <A, B, C>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
    g: (b: B) => C,
  ): IsEq<Kind<F, [C]>> => {
    const { F } = this;
    return pipe(fa, F.map(f), F.map(g))['<=>'](F.map_(fa, compose(g, f)));
  };
}
