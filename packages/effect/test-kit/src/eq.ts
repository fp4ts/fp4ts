import { Eq, Option, Some, None, Try, Either, IdentityK } from '@cats4ts/cats';
import { SyncIO, IO, IORuntime, IOOutcome } from '@cats4ts/effect-core';
import { Outcome, ExecutionContext } from '@cats4ts/effect-kernel';
import { Pure } from '@cats4ts/effect-core/lib/io/algebra';

import { TestExecutionContext } from './test-execution-context';

export const eqSyncIO = <A>(E: Eq<A>): Eq<SyncIO<A>> =>
  Eq.by(Try.Eq(Eq.Error.strict, E), x => Try(() => x.unsafeRunSync()));

export const eqIO = <A>(
  E: Eq<A>,
  ec: TestExecutionContext = new TestExecutionContext(),
  autoSuspendThreshold: number = Infinity,
): Eq<IO<A>> => {
  const _Eq = Option.Eq(Either.Eq(Eq.Error.strict, E));

  return Eq.by(_Eq, ioa => {
    let result: Option<Either<Error, A>> = None;
    ioa.unsafeRunAsync(
      ea => (result = Some(ea)),
      new IORuntime(ec, () => {}, { autoSuspendThreshold }),
    );

    ec.tickAll();

    return result;
  });
};

export const eqIOOutcome = <A>(E: Eq<A>): Eq<IOOutcome<A>> =>
  Eq.by(Outcome.Eq(Eq.Error.strict, E), oc =>
    oc.fold<Outcome<IdentityK, Error, A>>(
      () => Outcome.canceled(),
      Outcome.failure,
      ioa => {
        if (ioa instanceof Pure) return ioa.value;
        throw new Error('Unexpected IO result');
      },
    ),
  );

export const eqExecutionContext: Eq<ExecutionContext> =
  Eq.fromUniversalEquals();
