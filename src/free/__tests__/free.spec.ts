import { $, TyK, _ } from '../../core';
import { FunctionK } from '../../cats';
import { State } from '../../cats/data';
import { StateK } from '../../cats/data/state/state';
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

declare module '../../core/hkt/hkt' {
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

  it('should translate to state', () => {
    const program: Free<TestConsoleK, void> = Free.suspend(
      new WriteLine('What is your name?'),
    )
      .flatMap(() => Free.suspend(ReadLine))
      .flatMap(name => Free.suspend(new WriteLine(`Hello ${name}!`)));

    const resultState = program.mapK(State.Monad<S>())(nt);

    const [s, a] = resultState.runState([['James'], []]);
    expect(s).toEqual([[], ['What is your name?', 'Hello James!']]);
    expect(a).toBeUndefined();
  });

  it('should be stack safe', () => {
    const size = 10_000;
    const loop = (i: number): Free<TestConsoleK, void> =>
      i < size
        ? Free.suspend(new WriteLine('')).flatMap(() => loop(i + 1))
        : Free.pure(undefined);

    const state = loop(0).mapK(State.Monad<S>())(nt);

    expect(state.runState([[], []])).toEqual([
      [[], [...new Array(size).keys()].map(() => '')],
      undefined,
    ]);
  });
});
