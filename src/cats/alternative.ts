import { Kind, Kind2 } from '../fp/hkt';
import { List } from './data';
import {
  Applicative,
  Applicative2C,
  Applicative2,
  Applicative2CRequirements,
  Applicative2Requirements,
  ApplicativeRequirements,
} from './applicative';
import {
  MonoidK,
  MonoidK2C,
  MonoidK2,
  MonoidK2CRequirements,
  MonoidK2Requirements,
  MonoidKRequirements,
} from './monoid-k';

export interface Alternative<F> extends Applicative<F>, MonoidK<F> {
  readonly many: <A>(fa: Kind<F, A>) => Kind<F, List<A>>;
  readonly many1: <A>(fa: Kind<F, A>) => Kind<F, List<A>>;
}

export type AlternativeRequirements<F> = ApplicativeRequirements<F> &
  MonoidKRequirements<F> &
  Partial<Alternative<F>>;
export const Alternative = {
  of: <F>(F: AlternativeRequirements<F>): Alternative<F> => {
    const self: Alternative<F> = Object.freeze({
      many: <A>(fa: Kind<F, A>): Kind<F, List<A>> =>
        self.combineK_(self.many1(fa), self.pure(List.empty as List<A>)),

      many1: <A>(fa: Kind<F, A>): Kind<F, List<A>> =>
        self.map2_(fa, self.many(fa))((a, as) => as.prepend(a)),

      ...MonoidK.of<F>(F),
      ...Applicative.of<F>(F),
      ...F,
    });
    return self;
  },
};

export interface Alternative2C<F, E>
  extends Applicative2C<F, E>,
    MonoidK2C<F, E> {
  readonly many: <A>(fa: Kind2<F, E, A>) => Kind2<F, E, List<A>>;
  readonly many1: <A>(fa: Kind2<F, E, A>) => Kind2<F, E, List<A>>;
}

export type Alternative2CRequirements<F, E> = Applicative2CRequirements<F, E> &
  MonoidK2CRequirements<F, E> &
  Partial<Alternative2C<F, E>>;
export const Alternative2C = {
  of: <F, E>(F: Alternative2CRequirements<F, E>): Alternative2C<F, E> => {
    const self: Alternative2C<F, E> = Object.freeze({
      many: <A>(fa: Kind2<F, E, A>): Kind2<F, E, List<A>> =>
        self.combineK_(self.many1(fa), self.pure(List.empty as List<A>)),

      many1: <A>(fa: Kind2<F, E, A>): Kind2<F, E, List<A>> =>
        self.map2_(fa, self.many(fa))((a, as) => as.prepend(a)),

      ...MonoidK2C.of<F, E>(F),
      ...Applicative2C.of<F, E>(F),
      ...F,
    });
    return self;
  },
};

export interface Alternative2<F> extends Applicative2<F>, MonoidK2<F> {
  readonly many: <E, A>(fa: Kind2<F, E, A>) => Kind2<F, E, List<A>>;
  readonly many1: <E, A>(fa: Kind2<F, E, A>) => Kind2<F, E, List<A>>;
}

export type Alternative2Requirements<F> = Applicative2Requirements<F> &
  MonoidK2Requirements<F> &
  Partial<Alternative2<F>>;
export const Alternative2 = {
  of: <F>(F: Alternative2Requirements<F>): Alternative2<F> => {
    const self: Alternative2<F> = Object.freeze({
      many: <E, A>(fa: Kind2<F, E, A>): Kind2<F, E, List<A>> =>
        self.combineK_(self.many1(fa), self.pure(List.empty as List<A>)),

      many1: <E, A>(fa: Kind2<F, E, A>): Kind2<F, E, List<A>> =>
        self.map2_(fa, self.many(fa))((a, as) => as.prepend(a)),

      ...MonoidK2.of<F>(F),
      ...Applicative2.of<F>(F),
      ...F,
    });
    return self;
  },
};
