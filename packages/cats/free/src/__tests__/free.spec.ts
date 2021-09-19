import { $, TyK, _ } from '@cats4ts/core';
import { FunctionK } from '@cats4ts/cats-core';
import { State, StateK } from '@cats4ts/cats-core/lib/data';
import { Free } from '../free';

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
const TestConsoleURI = 'tests/free/test-console';
type TestConsoleURI = typeof TestConsoleURI;
type TestConsoleK = TyK<TestConsoleURI, [_]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [TestConsoleURI]: TestConsole<Tys[0]>;
  }
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
    const program: Free<TestConsoleK, void> = Free.suspend(
      new WriteLine('What is your name?'),
    )
      .flatMap(() => readLine)
      .flatMap(name => writeLine(`Hello ${name}!`));

    const resultState = program.mapK(State.Monad<S>())(nt);

    const [s, a] = resultState.runState([['James'], []]);
    expect(s).toEqual([[], ['What is your name?', 'Hello James!']]);
    expect(a).toBeUndefined();
  });

  it('should be stack safe', () => {
    const size = 10_000;
    const loop = (i: number): Free<TestConsoleK, void> =>
      i < size
        ? writeLine('').flatMap(() => loop(i + 1))
        : Free.pure(undefined);

    const state = loop(0).mapK(State.Monad<S>())(nt);

    expect(state.runState([[], []])).toEqual([
      [[], [...new Array(size).keys()].map(() => '')],
      undefined,
    ]);
  });
});
