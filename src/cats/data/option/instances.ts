import { Lazy, URI, V } from '../../../core';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Alternative } from '../../alternative';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';

import { OptionURI } from './option';
import { flatMap_, flatTap_, flatten, map_, or_ } from './operators';
import { none, pure } from './constructors';

export type Variance = V<'A', '+'>;

export const optionSemigroupK: Lazy<
  SemigroupK<[URI<OptionURI, Variance>], Variance>
> = () => SemigroupK.of({ combineK_: or_ });

export const optionMonoidK: Lazy<
  MonoidK<[URI<OptionURI, Variance>], Variance>
> = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { algebra, ...rest } = optionSemigroupK();
  return MonoidK.of({ ...rest, emptyK: () => none });
};

export const optionFunctor: Lazy<
  Functor<[URI<OptionURI, Variance>], Variance>
> = () => Functor.of({ map_ });

export const optionApply: Lazy<Apply<[URI<OptionURI, Variance>], Variance>> =
  () =>
    Apply.of({
      ...optionFunctor(),
      ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
    });

export const optionApplicative: Lazy<
  Applicative<[URI<OptionURI, Variance>], Variance>
> = () =>
  Applicative.of({
    ...optionApply(),
    pure: pure,
  });

export const optionAlternative: Lazy<
  Alternative<[URI<OptionURI, Variance>], Variance>
> = () =>
  Alternative.of({
    ...optionApplicative(),
    ...optionMonoidK(),
  });

export const optionFlatMap: Lazy<
  FlatMap<[URI<OptionURI, Variance>], Variance>
> = () =>
  FlatMap.of({
    ...optionApply(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
  });

export const optionMonad: Lazy<Monad<[URI<OptionURI, Variance>], Variance>> =
  () =>
    Monad.of({
      ...optionApplicative(),
      ...optionFlatMap(),
    });
