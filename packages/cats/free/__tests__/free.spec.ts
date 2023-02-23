// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { $type, HKT, id, TyK, TyVar } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { FunctionK } from '@fp4ts/cats-core';
import {
  OptionF,
  Option,
  IdentityF,
  Identity,
} from '@fp4ts/cats-core/lib/data';
import { State, StateF } from '@fp4ts/cats-mtl';
import { MonadDeferSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

import { Free } from '@fp4ts/cats-free';

import { fp4tsFree } from './free-arbitraries';

class TestConsole<A> implements HKT<TestConsoleF, [A]> {
  public readonly __void!: void;
  public readonly F!: TestConsoleF;
  public readonly Vars!: [A];
}

const ReadLine = new (class ReadLine extends TestConsole<string> {
  public readonly tag = 'readLine';
})();
type ReadLine = typeof ReadLine;
class WriteLine extends TestConsole<void> {
  public readonly tag = 'writeLine';
  public constructor(public readonly line: string) {
    super();
  }
}

interface TestConsoleF extends TyK<[unknown]> {
  [$type]: TestConsole<TyVar<this, 0>>;
}

describe('Free', () => {
  type S = [string[], string[]];
  const nt: FunctionK<TestConsoleF, StateF<S>> = <A>(
    _c: TestConsole<A>,
  ): State<S, A> => {
    const c = _c as any as WriteLine | ReadLine;
    if (c.tag === 'readLine') {
      return State.state(([[h, ...t], o]: S) => [
        h,
        [t, o] as S,
      ]) as any as State<S, A>;
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
    const program: Free<TestConsoleF, void> = Free.suspend(
      new WriteLine('What is your name?'),
    )
      .flatMap(() => readLine)
      .flatMap(name => writeLine(`Hello ${name}!`));

    const resultState = program.foldMap(State.Monad<S>())(nt);

    const [a, s] = resultState.runState([['James'], []]);
    expect(s).toEqual([[], ['What is your name?', 'Hello James!']]);
    expect(a).toBeUndefined();
  });

  it('should be stack safe (left heavy)', () => {
    const size = 50_000;

    let fa: Free<IdentityF, number> = Free.pure(0);
    for (let i = 0; i < 50_000; i++) {
      fa = fa.flatMap(n => Free.pure(n + 1));
    }

    expect(fa.foldMap(Identity.Monad)(id)).toEqual(size);
  });

  checkAll(
    'MonadDefer<Free<Identity, *>>',
    MonadDeferSuite(Free.Monad<IdentityF>()).monadDefer(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      x => fp4tsFree(x, x),
      <X>(E: Eq<X>) =>
        Eq.by<Free<IdentityF, X>, Identity<X>>(E, f =>
          f.foldMap(Identity.Monad)(id),
        ),
    ),
  );

  checkAll(
    'MonadDefer<Free<Option, *>>',
    MonadDeferSuite(Free.Monad<OptionF>()).monadDefer(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      x => fp4tsFree(A.fp4tsOption(x), x),
      <X>(E: Eq<X>) =>
        Eq.by<Free<OptionF, X>, Option<X>>(Option.Eq(E), f =>
          f.runTailRec(Option.Monad),
        ),
    ),
  );
});
