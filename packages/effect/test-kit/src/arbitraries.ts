import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind, snd } from '@cats4ts/core';
import { List, Ord, OrderedMap } from '@cats4ts/cats';
import { SyncIO } from '@cats4ts/effect-core';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { GenK, KindGenerator, SyncGenerators } from './kind-generators';

export const cats4tsSyncIO = <A>(arbA: Arbitrary<A>): Arbitrary<SyncIO<A>> =>
  cats4tsKind(arbA, SyncGenerators(SyncIO.Sync, A.cats4tsError()));

export const cats4tsKind = <F extends AnyK, A>(
  arbA: Arbitrary<A>,
  KG: KindGenerator<F>,
): Arbitrary<Kind<F, [A]>> => {
  const maxDepth = 10;

  const baseCase = KG.baseGen(arbA);
  const recursiveCase = (deeper: GenK<F>) =>
    baseCase['+++'](KG.recursiveGen(arbA, deeper));

  const stripDuplicates = (cases: List<[string, Arbitrary<Kind<F, [A]>>]>) =>
    OrderedMap.fromList(Ord.primitive)(cases).toArray.map(snd);

  const { gen } = fc.letrec(tie => ({
    base: fc.oneof(...stripDuplicates(baseCase.reverse)),
    recursive: fc.oneof(
      ...stripDuplicates(
        recursiveCase(() => tie('gen') as Arbitrary<Kind<F, [A]>>),
      ),
    ),
    gen: fc.oneof({ maxDepth }, tie('base'), tie('recursive')) as Arbitrary<
      Kind<F, [A]>
    >,
  }));

  return gen;
};
