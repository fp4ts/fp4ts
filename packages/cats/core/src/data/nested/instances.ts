import { $, Kind } from '@fp4ts/core';
import { Functor } from '../../functor';
import { Applicative } from '../../applicative';
import { Eq } from '../../eq';
import { Nested } from './algebra';
import { NestedK } from './nested';

export const nestedEq = <F, G, A>(
  EFGA: Eq<Kind<F, [Kind<G, [A]>]>>,
): Eq<Nested<F, G, A>> =>
  Eq.by<Nested<F, G, A>, Kind<F, [Kind<G, [A]>]>>(EFGA, x => x.value);

export const nestedFunctor: <F, G>(
  F: Functor<F>,
  G: Functor<G>,
) => Functor<$<NestedK, [F, G]>> = <F, G>(
  F: Functor<F>,
  G: Functor<G>,
): Functor<$<NestedK, [F, G]>> => {
  const FG = Functor.compose(F, G);
  // @ts-ignore
  return Functor.of({ map_: (fa, f) => new Nested(FG.map_(fa.value, f)) });
};

export const nestedApplicative: <F, G>(
  F: Applicative<F>,
  G: Applicative<G>,
) => Applicative<$<NestedK, [F, G]>> = <F, G>(
  F: Applicative<F>,
  G: Applicative<G>,
): Applicative<$<NestedK, [F, G]>> => {
  const FG = Applicative.compose(F, G);
  return Applicative.of({
    // @ts-ignore
    ap_: (ff, fa) => new Nested(FG.ap_(ff.value, fa.value)),
    // @ts-ignore
    pure: a => new Nested(FG.pure(a)),
  });
};
