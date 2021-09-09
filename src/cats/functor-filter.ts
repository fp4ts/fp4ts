import { id } from '../fp/core';
import { Kind, Kind2 } from '../fp/hkt';
import {
  Functor,
  Functor2C,
  Functor2,
  FunctorRequirements,
  Functor2CRequirements,
  Functor2Requirements,
} from './functor';
import { Option, Some, None } from './data/option';

export interface FunctorFilter<F> extends Functor<F> {
  readonly mapFilter: <A, B>(
    f: (a: A) => Option<B>,
  ) => (fa: Kind<F, A>) => Kind<F, B>;
  readonly mapFilter_: <A, B>(
    fa: Kind<F, A>,
    f: (a: A) => Option<B>,
  ) => Kind<F, B>;

  readonly collect: <A, B>(
    f: (a: A) => Option<B>,
  ) => (fa: Kind<F, A>) => Kind<F, B>;
  readonly collect_: <A, B>(
    fa: Kind<F, A>,
    f: (a: A) => Option<B>,
  ) => Kind<F, B>;

  readonly flattenOption: <A>(ffa: Kind<F, Option<A>>) => Kind<F, A>;

  readonly filter: <A>(p: (a: A) => boolean) => (fa: Kind<F, A>) => Kind<F, A>;
  readonly filter_: <A>(fa: Kind<F, A>, p: (a: A) => boolean) => Kind<F, A>;

  readonly filterNot: <A>(
    p: (a: A) => boolean,
  ) => (fa: Kind<F, A>) => Kind<F, A>;
  readonly filterNot_: <A>(fa: Kind<F, A>, p: (a: A) => boolean) => Kind<F, A>;
}

export type FunctorFilterRequirements<F> = Pick<
  FunctorFilter<F>,
  'mapFilter_'
> &
  FunctorRequirements<F> &
  Partial<FunctorFilter<F>>;

export const FunctorFilter = Object.freeze({
  of: <F>(F: FunctorFilterRequirements<F>): FunctorFilter<F> => {
    const self: FunctorFilter<F> = {
      mapFilter: f => fa => self.mapFilter_(fa, f),

      collect: f => fa => self.mapFilter_(fa, f),
      collect_: (fa, f) => self.mapFilter_(fa, f),

      flattenOption: fa => self.collect_(fa, id),

      filter: f => fa => self.filter_(fa, f),
      filter_: (fa, p) => self.collect_(fa, x => (p(x) ? Some(x) : None)),

      filterNot: f => fa => self.filterNot_(fa, f),
      filterNot_: (fa, p) => self.filter_(fa, x => !p(x)),

      ...Functor.of<F>(F),
      ...F,
    };
    return self;
  },
});

export interface FunctorFilter2C<F, E> extends Functor2C<F, E> {
  readonly mapFilter: <A, B>(
    f: (a: A) => Option<B>,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, B>;
  readonly mapFilter_: <A, B>(
    fa: Kind2<F, E, A>,
    f: (a: A) => Option<B>,
  ) => Kind2<F, E, B>;

  readonly collect: <A, B>(
    f: (a: A) => Option<B>,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, B>;
  readonly collect_: <A, B>(
    fa: Kind2<F, E, A>,
    f: (a: A) => Option<B>,
  ) => Kind2<F, E, B>;

  readonly flattenOption: <A>(ffa: Kind2<F, E, Option<A>>) => Kind2<F, E, A>;

  readonly filter: <A>(
    p: (a: A) => boolean,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, A>;
  readonly filter_: <A>(
    fa: Kind2<F, E, A>,
    p: (a: A) => boolean,
  ) => Kind2<F, E, A>;

  readonly filterNot: <A>(
    p: (a: A) => boolean,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, A>;
  readonly filterNot_: <A>(
    fa: Kind2<F, E, A>,
    p: (a: A) => boolean,
  ) => Kind2<F, E, A>;
}

export type FunctorFilter2CRequirements<F, E> = Pick<
  FunctorFilter2C<F, E>,
  'mapFilter_'
> &
  Functor2CRequirements<F, E> &
  Partial<FunctorFilter2C<F, E>>;

export const FunctorFilter2C = Object.freeze({
  of: <F, E>(F: FunctorFilter2CRequirements<F, E>): FunctorFilter2C<F, E> => {
    const self: FunctorFilter2C<F, E> = {
      mapFilter: f => fa => self.mapFilter_(fa, f),

      collect: f => fa => self.mapFilter_(fa, f),
      collect_: (fa, f) => self.mapFilter_(fa, f),

      flattenOption: fa => self.collect_(fa, id),

      filter: f => fa => self.filter_(fa, f),
      filter_: (fa, p) => self.collect_(fa, x => (p(x) ? Some(x) : None)),

      filterNot: f => fa => self.filterNot_(fa, f),
      filterNot_: (fa, p) => self.filter_(fa, x => !p(x)),

      ...Functor2C.of<F, E>(F),
      ...F,
    };
    return self;
  },
});

export interface FunctorFilter2<F> extends Functor2<F> {
  readonly mapFilter: <A, B>(
    f: (a: A) => Option<B>,
  ) => <E>(fa: Kind2<F, E, A>) => Kind2<F, E, B>;
  readonly mapFilter_: <E, A, B>(
    fa: Kind2<F, E, A>,
    f: (a: A) => Option<B>,
  ) => Kind2<F, E, B>;

  readonly collect: <A, B>(
    f: (a: A) => Option<B>,
  ) => <E>(fa: Kind2<F, E, A>) => Kind2<F, E, B>;
  readonly collect_: <E, A, B>(
    fa: Kind2<F, E, A>,
    f: (a: A) => Option<B>,
  ) => Kind2<F, E, B>;

  readonly flattenOption: <E, A>(ffa: Kind2<F, E, Option<A>>) => Kind2<F, E, A>;

  readonly filter: <A>(
    p: (a: A) => boolean,
  ) => <E>(fa: Kind2<F, E, A>) => Kind2<F, E, A>;
  readonly filter_: <E, A>(
    fa: Kind2<F, E, A>,
    p: (a: A) => boolean,
  ) => Kind2<F, E, A>;

  readonly filterNot: <A>(
    p: (a: A) => boolean,
  ) => <E>(fa: Kind2<F, E, A>) => Kind2<F, E, A>;
  readonly filterNot_: <E, A>(
    fa: Kind2<F, E, A>,
    p: (a: A) => boolean,
  ) => Kind2<F, E, A>;
}

export type FunctorFilter2Requirements<F> = Pick<
  FunctorFilter2<F>,
  'mapFilter_'
> &
  Functor2Requirements<F> &
  Partial<FunctorFilter2<F>>;

export const FunctorFilter2 = Object.freeze({
  of: <F>(F: FunctorFilter2Requirements<F>): FunctorFilter2<F> => {
    const self: FunctorFilter2<F> = {
      mapFilter: f => fa => self.mapFilter_(fa, f),

      collect: f => fa => self.mapFilter_(fa, f),
      collect_: (fa, f) => self.mapFilter_(fa, f),

      flattenOption: fa => self.collect_(fa, id),

      filter: f => fa => self.filter_(fa, f),
      filter_: (fa, p) => self.collect_(fa, x => (p(x) ? Some(x) : None)),

      filterNot: f => fa => self.filterNot_(fa, f),
      filterNot_: (fa, p) => self.filter_(fa, x => !p(x)),

      ...Functor2.of<F>(F),
      ...F,
    };
    return self;
  },
});
