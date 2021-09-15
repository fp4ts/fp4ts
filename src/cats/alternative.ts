import { Kind, AnyK } from '../core';
import { List } from './data';
import { Applicative, ApplicativeRequirements } from './applicative';
import { MonoidK, MonoidKRequirements } from './monoid-k';

export interface Alternative<F extends AnyK>
  extends Applicative<F>,
    MonoidK<F> {
  readonly many: <A>(fa: Kind<F, [A]>) => Kind<F, [List<A>]>;
  readonly many1: <A>(fa: Kind<F, [A]>) => Kind<F, [List<A>]>;
}

export type AlternativeRequirements<F extends AnyK> =
  ApplicativeRequirements<F> & MonoidKRequirements<F> & Partial<Alternative<F>>;
export const Alternative = Object.freeze({
  of: <F extends AnyK>(F: AlternativeRequirements<F>): Alternative<F> => {
    const self: Alternative<F> = {
      many: <A>(fa: Kind<F, [A]>): Kind<F, [List<A>]> =>
        self.combineK_(self.many1(fa), self.pure(List.empty as List<A>)),

      many1: fa => self.map2_(fa, self.many(fa))((a, as) => as.prepend(a)),

      ...MonoidK.of(F),
      ...Applicative.of(F),
      ...F,
    };
    return self;
  },
});
