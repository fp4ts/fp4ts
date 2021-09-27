import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats-core';
import { Option } from '@cats4ts/cats-core/lib/data';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { FunctorFilterLaws } from '../functor-filter-laws';
import { FunctorSuite } from './functor-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const FunctorFilterSuite = <F extends AnyK>(
  laws: FunctorFilterLaws<F>,
) => {
  const self = {
    ...FunctorSuite(laws),

    functorFilter: <A, B, C>(
      arbFA: Arbitrary<Kind<F, [A]>>,
      arbFOptionA: Arbitrary<Kind<F, [Option<A>]>>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqFA: Eq<Kind<F, [A]>>,
      EqFB: Eq<Kind<F, [B]>>,
      EqFC: Eq<Kind<F, [C]>>,
    ): RuleSet =>
      new RuleSet(
        'functor filter',
        [
          [
            'mapFilter map filter composition',
            forAll(
              arbFA,
              fc.func<[A], Option<B>>(A.cats4tsOption(arbB)),
              fc.func<[B], Option<C>>(A.cats4tsOption(arbC)),
              laws.mapFilterComposition,
            )(EqFC),
          ],
          [
            'mapFilter map filter consistency',
            forAll(
              arbFA,
              fc.func<[A], B>(arbB),
              laws.mapFilterMapConsistency,
            )(EqFB),
          ],
          [
            'mapFilter collect consistent with map filter',
            forAll(
              arbFA,
              fc.func<[A], Option<B>>(A.cats4tsOption(arbB)),
              laws.collectConsistentWithMapFilter,
            )(EqFB),
          ],
          [
            'mapFilter flatten option consistent with map filter identity',
            forAll(
              arbFOptionA,
              fc.func<[A], Option<B>>(A.cats4tsOption(arbB)),
              laws.collectConsistentWithMapFilter,
            )(EqFA),
          ],
          [
            'mapFilter filter consistent with map filter',
            forAll(
              arbFA,
              fc.func<[A], boolean>(fc.boolean()),
              laws.filterConsistentWithMapFilter,
            )(EqFA),
          ],
          [
            'filterNot consistent with filter',
            forAll(
              arbFA,
              fc.func<[A], boolean>(fc.boolean()),
              laws.filterNotConsistentWithFilter,
            )(EqFA),
          ],
        ],
        { parent: self.functor(arbFA, arbB, arbC, EqFA, EqFC) },
      ),
  };
  return self;
};
