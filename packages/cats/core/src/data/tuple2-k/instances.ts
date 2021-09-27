import { $, AnyK, Kind } from '@cats4ts/core';
import { Eq } from '../../eq';
import { Functor } from '../../functor';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';

import { Tuple2K, Tuple2kK } from './tuple2-k';

export const tuple2KEq: <F extends AnyK, G extends AnyK, A>(
  EF: Eq<Kind<F, [A]>>,
  EG: Eq<Kind<G, [A]>>,
) => Eq<Tuple2K<F, G, A>> = (EF, EG) =>
  Eq.of({
    equals: (lhs, rhs) =>
      EF.equals(lhs.fst, rhs.fst) && EG.equals(lhs.snd, rhs.snd),
  });

export const tuple2KFunctor: <F extends AnyK, G extends AnyK>(
  F: Functor<F>,
  G: Functor<G>,
) => Functor<$<Tuple2kK, [F, G]>> = (F, G) =>
  Functor.of({
    map_: (fa, f) => Tuple2K(F.map_(fa.fst, f), G.map_(fa.snd, f)),
  });

export const tuple2KApply: <F extends AnyK, G extends AnyK>(
  F: Apply<F>,
  G: Apply<G>,
) => Apply<$<Tuple2kK, [F, G]>> = (F, G) =>
  Apply.of({
    ...tuple2KFunctor(F, G),
    ap_: (ff, fa) => {
      const [fstF, sndF] = [ff.fst, ff.snd];
      const [fstA, sndA] = [fa.fst, fa.snd];
      return Tuple2K(F.ap_(fstF, fstA), G.ap_(sndF, sndA));
    },
  });

export const tuple2KApplicative: <F extends AnyK, G extends AnyK>(
  F: Applicative<F>,
  G: Applicative<G>,
) => Applicative<$<Tuple2kK, [F, G]>> = (F, G) =>
  Applicative.of({
    ...tuple2KApply(F, G),
    pure: a => Tuple2K(F.pure(a), G.pure(a)),
  });
