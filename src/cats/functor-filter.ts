import { Kind, id, Auto } from '../core';
import { Functor, FunctorRequirements } from './functor';
import { Option, Some, None } from './data/option';

export interface FunctorFilter<F, C = Auto> extends Functor<F, C> {
  readonly mapFilter: <A, B>(
    f: (a: A) => Option<B>,
  ) => <S, R, E>(fa: Kind<F, C, S, R, E, A>) => Kind<F, C, S, R, E, B>;
  readonly mapFilter_: <S, R, E, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    f: (a: A) => Option<B>,
  ) => Kind<F, C, S, R, E, B>;

  readonly collect: <A, B>(
    f: (a: A) => Option<B>,
  ) => <S, R, E>(fa: Kind<F, C, S, R, E, A>) => Kind<F, C, S, R, E, B>;
  readonly collect_: <S, R, E, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    f: (a: A) => Option<B>,
  ) => Kind<F, C, S, R, E, B>;

  readonly flattenOption: <S, R, E, A>(
    ffa: Kind<F, C, S, R, E, Option<A>>,
  ) => Kind<F, C, S, R, E, A>;

  readonly filter: <A>(
    p: (a: A) => boolean,
  ) => <S, R, E>(fa: Kind<F, C, S, R, E, A>) => Kind<F, C, S, R, E, A>;
  readonly filter_: <S, R, E, A>(
    fa: Kind<F, C, S, R, E, A>,
    p: (a: A) => boolean,
  ) => Kind<F, C, S, R, E, A>;

  readonly filterNot: <A>(
    p: (a: A) => boolean,
  ) => <S, R, E>(fa: Kind<F, C, S, R, E, A>) => Kind<F, C, S, R, E, A>;
  readonly filterNot_: <S, R, E, A>(
    fa: Kind<F, C, S, R, E, A>,
    p: (a: A) => boolean,
  ) => Kind<F, C, S, R, E, A>;
}

export type FunctorFilterRequirements<F, C = Auto> = Pick<
  FunctorFilter<F, C>,
  'mapFilter_'
> &
  FunctorRequirements<F, C> &
  Partial<FunctorFilter<F, C>>;

export const FunctorFilter = Object.freeze({
  of: <F, C = Auto>(
    F: FunctorFilterRequirements<F, C>,
  ): FunctorFilter<F, C> => {
    const self: FunctorFilter<F, C> = {
      mapFilter: f => fa => self.mapFilter_(fa, f),

      collect: f => fa => self.mapFilter_(fa, f),
      collect_: (fa, f) => self.mapFilter_(fa, f),

      flattenOption: fa => self.collect_(fa, id),

      filter: f => fa => self.filter_(fa, f),
      filter_: (fa, p) => self.collect_(fa, x => (p(x) ? Some(x) : None)),

      filterNot: f => fa => self.filterNot_(fa, f),
      filterNot_: (fa, p) => self.filter_(fa, x => !p(x)),

      ...Functor.of<F, C>(F),
      ...F,
    };
    return self;
  },
});
