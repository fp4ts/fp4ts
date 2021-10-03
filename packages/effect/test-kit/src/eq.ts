import { Eq, Try, Either, IdentityK } from '@cats4ts/cats';
import { SyncIO, IO, IORuntime, IOOutcome } from '@cats4ts/effect-core';
import { Outcome } from '@cats4ts/effect-kernel';
import { IsEq } from '@cats4ts/cats-test-kit';
import { TestExecutionContext } from './test-execution-context';
import { Pure } from '@cats4ts/effect-core/lib/io/algebra';

export const eqSyncIO = <A>(E: Eq<A>): Eq<SyncIO<A>> =>
  Eq.by(Try.Eq(Eq.Error.strict, E), x => Try(() => x.unsafeRunSync()));

export const eqIO = <A>(
  E: Eq<A>,
  ec: TestExecutionContext = new TestExecutionContext(),
  autoSuspendThreshold: number = Infinity,
): ((r: IsEq<IO<A>>) => Promise<boolean>) => {
  const _Eq = Either.Eq(Eq.Error.strict, E);
  const MAX_AWAITS = 10;
  const DELAY = 5;

  return async ({ lhs, rhs }) => {
    let lhsResult: Either<Error, A> | undefined;
    let rhsResult: Either<Error, A> | undefined;

    const awaitResults = async (i: number): Promise<void> => {
      // Ensure to insert an async boundary
      await new Promise(resolve => setImmediate(resolve));
      if (lhsResult || rhsResult || i >= MAX_AWAITS) return;
      ec.tickAll();
      await new Promise(resolve => setTimeout(resolve, DELAY));
      return awaitResults(i + 1);
    };

    lhs.unsafeRunAsync(
      ea => (lhsResult = ea),
      new IORuntime(ec, () => {}, { autoSuspendThreshold }),
    );

    rhs.unsafeRunAsync(
      ea => (rhsResult = ea),
      new IORuntime(ec, () => {}, { autoSuspendThreshold }),
    );

    ec.tickAll();

    await awaitResults(0);

    if (lhsResult === rhsResult) return true;
    if (!lhsResult) return false;
    if (!rhsResult) return false;
    return _Eq.equals(lhsResult, rhsResult);
  };
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
