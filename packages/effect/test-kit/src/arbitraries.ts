import fc, { Arbitrary } from 'fast-check';
import { Kind, snd } from '@cats4ts/core';
import { List, Ord, OrderedMap, Functor } from '@cats4ts/cats';
import { ExecutionContext, Resource } from '@cats4ts/effect-kernel';
import { SyncIO, IO } from '@cats4ts/effect-core';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import {
  AsyncGenerators,
  GenK,
  KindGenerator,
  SyncGenerators,
} from './kind-generators';
import { TestExecutionContext } from './test-execution-context';

export * from '@cats4ts/cats-test-kit/lib/arbitraries';

export const cats4tsResource =
  <F>(F: Functor<F>) =>
  <A>(
    arbA: Arbitrary<A>,
    mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
  ): Arbitrary<Resource<F, A>> => {
    const arbAllocate: Arbitrary<Resource<F, A>> = mkArbF(arbA).chain(alloc =>
      mkArbF(fc.constant(undefined as void)).map(dispose =>
        Resource<F>(F)(F.map_(alloc, a => [a, dispose])),
      ),
    );

    const arbFlatMap: Arbitrary<Resource<F, A>> = arbAllocate.map(r =>
      r.flatMap(a => Resource.pure(a)),
    );

    const arbEval: Arbitrary<Resource<F, A>> = mkArbF(arbA).map(Resource.evalF);
    const genPure: Arbitrary<Resource<F, A>> = arbA.map(Resource.pure);

    return fc.frequency(
      { weight: 5, arbitrary: arbAllocate },
      { weight: 1, arbitrary: arbFlatMap },
      { weight: 1, arbitrary: arbEval },
      { weight: 1, arbitrary: genPure },
    );
  };

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
