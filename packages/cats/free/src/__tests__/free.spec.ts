// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { $, $type, id, tupled, TyK, TyVar } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { FunctionK, Eval, Monad } from '@fp4ts/cats-core';
import {
  State,
  StateF,
  OptionF,
  Option,
  IdentityF,
  Identity,
} from '@fp4ts/cats-core/lib/data';
import { MonadSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

import { Free } from '../free';

import { fp4tsFree } from './free-arbitraries';

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
interface TestConsoleF extends TyK<[unknown]> {
  [$type]: TestConsole<TyVar<this, 0>>;
}

describe('Free', () => {
  type S = [string[], string[]];
  const nt: FunctionK<TestConsoleF, $<StateF, [S]>> = <A>(
    c: TestConsole<A>,
  ): State<S, A> => {
    if (c.tag === 'readLine') {
      return State.inspect<S, string>(([[h]]) => h).modify(Eval.Functor)(
        ([[, ...t], o]) => tupled(t, o),
      ) as any as State<S, A>;
    }

    return State.modify<S>(([i, o]) => [i, [...o, c.line]]) as any as State<
      S,
      A
    >;
  };

  const lift = <A>(c: TestConsole<A>): Free<TestConsoleF, A> => Free.suspend(c);
  const writeLine = (line: string) => lift<void>(new WriteLine(line));
  const readLine = lift(ReadLine);

  it('should translate to state', () => {
    const program: Free<TestConsoleF, void> = Free.suspend<TestConsoleF, void>(
      new WriteLine('What is your name?'),
    )
      .flatMap(() => readLine)
      .flatMap(name => writeLine(`Hello ${name}!`));

    const resultState = program.mapK(
      // TODO: Fix?
      State.Monad<S>() as any as Monad<$<StateF, [S]>>,
    )(nt);

    const [s, a] = resultState.run(Eval.Monad)([['James'], []]).value;
    expect(s).toEqual([[], ['What is your name?', 'Hello James!']]);
    expect(a).toBeUndefined();
  });

  const identityMonadTests = MonadSuite(Free.Monad<IdentityF>());
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
      x => fp4tsFree(x, x),
      <X>(E: Eq<X>) =>
        Eq.by<Free<IdentityF, X>, Identity<X>>(E, f =>
          f.mapK(Identity.Monad)(id),
        ),
    ),
  );

  const monadTests = MonadSuite(Free.Monad<OptionF>());
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
      x => fp4tsFree(A.fp4tsOption(x), x),
      <X>(E: Eq<X>) =>
        Eq.by<Free<OptionF, X>, Option<X>>(Option.Eq(E), f =>
          f.mapK(Option.Monad)(id),
        ),
    ),
  );
});
