import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import {
  Applicative,
  Eq,
  Functor,
  Monoid,
  Traversable,
} from '@cats4ts/cats-core';
import { Nested, Tuple2K } from '@cats4ts/cats-core/lib/data';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { TraversableLaws } from '../traversable-laws';
import { FoldableSuite } from './foldable-suite';
import { FunctorSuite } from './functor-suite';
import { UnorderedTraversableSuite } from './unordered-traversable-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const TraversableSuite = <T extends AnyK>(T: Traversable<T>) => {
  const laws = TraversableLaws(T);
  const self = {
    ...FunctorSuite(T),
    ...FoldableSuite(T),
    ...UnorderedTraversableSuite(T),

    traversable: <A, B, C, F extends AnyK, G extends AnyK>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      MA: Monoid<A>,
      MB: Monoid<B>,
      T: Functor<T>,
      F: Applicative<F>,
      G: Applicative<G>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      mkArbT: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<T, [X]>>,
      mkEqT: <X>(E: Eq<X>) => Eq<Kind<T, [X]>>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
      mkArbG: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<G, [X]>>,
      mkEqG: <X>(E: Eq<X>) => Eq<Kind<G, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'traversable',
        [
          [
            'traversable identity',
            forAll(
              mkArbT(arbA),
              fc.func<[A], B>(arbB),
              laws.unorderedTraversableIdentity(T),
            )(mkEqT(EqB)),
          ],
          [
            'traversable sequential coposition',
            forAll(
              mkArbT(arbA),
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              fc.func<[B], Kind<G, [C]>>(mkArbG(arbC)),
              laws.traversableSequentialComposition(F, G),
            )(Nested.Eq(mkEqF(mkEqG(mkEqT(EqC))))),
          ],
          [
            'traversable parallel composition',
            forAll(
              mkArbT(arbA),
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              fc.func<[A], Kind<G, [B]>>(mkArbG(arbB)),
              laws.traversableParallelComposition(F, G),
            )(Tuple2K.Eq(mkEqF(mkEqT(EqB)), mkEqG(mkEqT(EqB)))),
          ],
        ],
        {
          parents: [
            self.functor(arbA, arbB, arbC, EqA, EqC, mkArbT, mkEqT),
            self.foldable(arbA, arbB, MA, MB, EqA, EqB, mkArbT),
            self.unorderedTraversable(
              arbA,
              arbB,
              arbC,
              EqA,
              EqB,
              EqC,
              MA,
              T,
              F,
              G,
              mkArbT,
              mkEqT,
              mkArbF,
              mkEqF,
              mkArbG,
              mkEqG,
            ),
          ],
        },
      ),
  };
  return self;
};
