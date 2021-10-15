import fc, { Arbitrary } from 'fast-check';
import { Kind, snd } from '@cats4ts/core';
import { List, Ord, OrderedMap } from '@cats4ts/cats';
import { SyncIO, IO } from '@cats4ts/effect-core';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import {
  AsyncGenerators,
  GenK,
  KindGenerator,
  SyncGenerators,
} from './kind-generators';
import { TestExecutionContext } from './test-execution-context';
import { ExecutionContext } from '@cats4ts/effect';

export * from '@cats4ts/cats-test-kit';

export const cats4tsIO = <A>(arbA: Arbitrary<A>): Arbitrary<IO<A>> =>
  cats4tsKind(
    arbA,
    AsyncGenerators(
      IO.Async,
      A.cats4tsError(),
      cats4tsExecutionContext(new TestExecutionContext()),
    ),
  );

export const cats4tsSyncIO = <A>(arbA: Arbitrary<A>): Arbitrary<SyncIO<A>> =>
  cats4tsKind(arbA, SyncGenerators(SyncIO.Sync, A.cats4tsError()));

export const cats4tsKind = <F, A>(
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

export const cats4tsExecutionContext = (
  ec: ExecutionContext,
): Arbitrary<ExecutionContext> =>
  fc.constant({
    executeAsync: thunk => ec.executeAsync(thunk),
    sleep: (ms, thunk) => ec.sleep(ms, thunk),
    currentTimeMillis: () => ec.currentTimeMillis(),
    reportFailure: e => ec.reportFailure(e),
  } as ExecutionContext);
