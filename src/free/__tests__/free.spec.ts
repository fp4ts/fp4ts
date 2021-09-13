import { FunctionK } from '../../cats';
import { State } from '../../cats/data';
import { StateURI } from '../../cats/data/state/state';
import { Fix, URI } from '../../core';
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

declare module '../../core/hkt/hkt' {
  interface URItoKind<FC, S, R, E, A> {
    [TestConsoleURI]: TestConsole<A>;
  }
}

describe('Free', () => {
  const program: Free<
    [URI<TestConsoleURI>],
    unknown,
    unknown,
    unknown,
    unknown,
    void
  > = Free.suspend(new WriteLine('What is your name?'))
    .flatMap(() => Free.suspend(ReadLine))
    .flatMap(name => Free.suspend(new WriteLine(`Hello ${name}!`)));

  it('should translate to state', () => {
    type S = [string[], string[]];

    const nt: FunctionK<[URI<TestConsoleURI>], [URI<StateURI, Fix<'S', S>>]> = <
      A,
    >(
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

    const resultState = program.mapK(State.Monad<S>())(nt);

    const [s, a] = resultState.runState([['James'], []]);
    expect(s).toEqual([[], ['What is your name?', 'Hello James!']]);
    expect(a).toBeUndefined();
  });
});
