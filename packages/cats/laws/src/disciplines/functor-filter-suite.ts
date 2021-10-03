import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq, FunctorFilter } from '@cats4ts/cats-core';
import { Option } from '@cats4ts/cats-core/lib/data';
import { forAll, IsEq, RuleSet } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { FunctorFilterLaws } from '../functor-filter-laws';
import { FunctorSuite } from './functor-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const FunctorFilterSuite = <F extends AnyK>(F: FunctorFilter<F>) => {
  const laws = FunctorFilterLaws(F);
  const self = {
    ...FunctorSuite(F),

    functorFilter: <A, B, C>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(
        E: Eq<X>,
      ) => Eq<Kind<F, [X]>> | ((r: IsEq<Kind<F, [X]>>) => Promise<boolean>),
    ): RuleSet =>
      new RuleSet(
        'functor filter',
        [
          [
            'mapFilter map filter composition',
            forAll(
              mkArbF(arbA),
              fc.func<[A], Option<B>>(A.cats4tsOption(arbB)),
              fc.func<[B], Option<C>>(A.cats4tsOption(arbC)),
              laws.mapFilterComposition,
            )(mkEqF(EqC)),
          ],
          [
            'mapFilter map filter consistency',
            forAll(
              mkArbF(arbA),
              fc.func<[A], B>(arbB),
              laws.mapFilterMapConsistency,
            )(mkEqF(EqB)),
          ],
          [
            'mapFilter collect consistent with map filter',
            forAll(
              mkArbF(arbA),
              fc.func<[A], Option<B>>(A.cats4tsOption(arbB)),
              laws.collectConsistentWithMapFilter,
            )(mkEqF(EqB)),
          ],
          [
            'mapFilter flatten option consistent with map filter identity',
            forAll(
              mkArbF(A.cats4tsOption(arbA)),
              fc.func<[A], Option<B>>(A.cats4tsOption(arbB)),
              laws.collectConsistentWithMapFilter,
            )(mkEqF(EqA)),
          ],
          [
            'mapFilter filter consistent with map filter',
            forAll(
              mkArbF(arbA),
              fc.func<[A], boolean>(fc.boolean()),
              laws.filterConsistentWithMapFilter,
            )(mkEqF(EqA)),
          ],
          [
            'filterNot consistent with filter',
            forAll(
              mkArbF(arbA),
              fc.func<[A], boolean>(fc.boolean()),
              laws.filterNotConsistentWithFilter,
            )(mkEqF(EqA)),
          ],
        ],
        { parent: self.functor(arbA, arbB, arbC, EqA, EqC, mkArbF, mkEqF) },
      ),
  };
  return self;
};
