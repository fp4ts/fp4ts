import { Auto, Kind, URIS } from '../core';
import { List } from './data';
import { Applicative, ApplicativeRequirements } from './applicative';
import { MonoidK, MonoidKRequirements } from './monoid-k';

export interface Alternative<F extends URIS, C = Auto>
  extends Applicative<F, C>,
    MonoidK<F, C> {
  readonly many: <S, R, E, A>(
    fa: Kind<F, C, S, R, E, A>,
  ) => Kind<F, C, S, R, E, List<A>>;
  readonly many1: <S, R, E, A>(
    fa: Kind<F, C, S, R, E, A>,
  ) => Kind<F, C, S, R, E, List<A>>;
}

export type AlternativeRequirements<
  F extends URIS,
  C = Auto,
> = ApplicativeRequirements<F, C> &
  MonoidKRequirements<F, C> &
  Partial<Alternative<F, C>>;
export const Alternative = Object.freeze({
  of: <F extends URIS, C = Auto>(
    F: AlternativeRequirements<F, C>,
  ): Alternative<F, C> => {
    const self: Alternative<F, C> = {
      many: <S, R, E, A>(
        fa: Kind<F, C, S, R, E, A>,
      ): Kind<F, C, S, R, E, List<A>> =>
        self.combineK_(self.many1(fa), self.pure(List.empty as List<A>)),

      many1: fa => self.map2_(fa, self.many(fa))((a, as) => as.prepend(a)),

      ...MonoidK.of(F),
      ...Applicative.of(F),
      ...F,
    };
    return self;
  },
});
