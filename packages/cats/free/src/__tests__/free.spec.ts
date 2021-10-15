import fc from 'fast-check';
import { $, $type, id, TyK, TyVar } from '@cats4ts/core';
import { FunctionK, Eq } from '@cats4ts/cats-core';
import {
  State,
  StateK,
  OptionK,
  Option,
  IdentityK,
  Identity,
} from '@cats4ts/cats-core/lib/data';
import { MonadSuite } from '@cats4ts/cats-laws';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { Free } from '../free';

import { cats4tsFree } from './free-arbitraries';

class TestConsoleBase<A> {
  public readonly __void!: void;
}

const ReadLine = new (class ReadLine extends TestConsoleBase<string> {
  public readonly tag = 'readLine';
})();
type ReadLine = typeof ReadLine;
class WriteLine extends TestConsoleBase<string> {
  public readonly tag = 'writeLine';
  public constructor(public readonly line: string) {
    super();
  }
}

type TestConsole<A> = ReadLine | WriteLine;
interface TestConsoleK extends TyK<[unknown]> {
  [$type]: TestConsole<TyVar<this, 0>>;
}

describe('Free', () => {
  type S = [string[], string[]];
  const nt: FunctionK<TestConsoleK, $<StateK, [S]>> = <A>(
    c: TestConsole<A>,
  ): State<S, A> => {
    if (c.tag === 'readLine')
      return State.modify<S, string>(([[h, ...t], o]) => [
        [t, o],
        h ?? '',
      ]) as any as State<S, A>;

    return State.update<S>(([i, o]) => [i, [...o, c.line]]) as any as State<
      S,
      A
    >;
  };

  const lift = <A>(c: TestConsole<A>): Free<TestConsoleK, A> => Free.suspend(c);
  const writeLine = (line: string) => lift<void>(new WriteLine(line));
  const readLine = lift(ReadLine);

  it('should translate to state', () => {
    const program: Free<TestConsoleK, void> = Free.suspend<TestConsoleK, void>(
      new WriteLine('What is your name?'),
    )
      .flatMap(() => readLine)
      .flatMap(name => writeLine(`Hello ${name}!`));

    const resultState = program.mapK(State.Monad<S>())(nt);

    const [s, a] = resultState.runState([['James'], []]);
    expect(s).toEqual([[], ['What is your name?', 'Hello James!']]);
    expect(a).toBeUndefined();
  });

  const eqFreeIdentityPrim: Eq<Free<IdentityK, number>> = Eq.by(
    Eq.primitive,
    f => f.mapK(Identity.Monad)(id),
  );

  const identityMonadTests = MonadSuite(Free.Monad<IdentityK>());
  checkAll(
    'Monad<$<Free, [IdentityK]>>',
    identityMonadTests.monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      x => cats4tsFree(x, x),
      <X>(E: Eq<X>) =>
        Eq.by<Free<IdentityK, X>, Identity<X>>(E, f =>
          f.mapK(Identity.Monad)(id),
        ),
    ),
  );

  const monadTests = MonadSuite(Free.Monad<OptionK>());
  checkAll(
    'Monad<$<Free, [OptionK]>>',
    monadTests.monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      x => cats4tsFree(A.cats4tsOption(x), x),
      <X>(E: Eq<X>) =>
        Eq.by<Free<OptionK, X>, Option<X>>(Option.Eq(E), f =>
          f.mapK(Option.Monad)(id),
        ),
    ),
  );
});
