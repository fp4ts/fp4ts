// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind, snd } from '@fp4ts/core';
import { List, Ord, Map, Functor } from '@fp4ts/cats';
import { ExecutionContext, Resource } from '@fp4ts/effect-kernel';
import { SyncIO, IO } from '@fp4ts/effect-core';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

import {
  AsyncGenerators,
  GenK,
  KindGenerator,
  SyncGenerators,
} from './kind-generators';
import { TestExecutionContext } from './test-execution-context';

export * from '@fp4ts/cats-test-kit/lib/arbitraries';

export const fp4tsResource =
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

export const fp4tsIO = <A>(arbA: Arbitrary<A>): Arbitrary<IO<A>> =>
  fp4tsKind(
    arbA,
    AsyncGenerators(
      IO.Async,
      A.fp4tsError(),
      fp4tsExecutionContext(new TestExecutionContext()),
    ),
  );

export const fp4tsSyncIO = <A>(arbA: Arbitrary<A>): Arbitrary<SyncIO<A>> =>
  fp4tsKind(arbA, SyncGenerators(SyncIO.Sync, A.fp4tsError()));

export const fp4tsKind = <F, A>(
  arbA: Arbitrary<A>,
  KG: KindGenerator<F>,
): Arbitrary<Kind<F, [A]>> => {
  const maxDepth = 10;

  const baseCase = KG.baseGen(arbA);
  const recursiveCase = (deeper: GenK<F>) =>
    baseCase['+++'](KG.recursiveGen(arbA, deeper));

  const stripDuplicates = (cases: List<[string, Arbitrary<Kind<F, [A]>>]>) =>
    Map.fromList(Ord.primitive)(cases).toArray.map(snd);

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

export const fp4tsExecutionContext = (
  ec: ExecutionContext,
): Arbitrary<ExecutionContext> =>
  fc.constant({
    executeAsync: thunk => ec.executeAsync(thunk),
    sleep: (ms, thunk) => ec.sleep(ms, thunk),
    currentTimeMillis: () => ec.currentTimeMillis(),
    reportFailure: e => ec.reportFailure(e),
  } as ExecutionContext);
