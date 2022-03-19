// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import { Show, State, StateF } from '@fp4ts/cats';
import { Console } from '@fp4ts/effect-std';

export type ConsoleState<A> = State<ConsoleStateState, A>;
export type ConsoleStateF = $<StateF, [ConsoleStateState]>;

export class TestConsoleState extends Console<ConsoleStateF> {
  public get readLine(): ConsoleState<string> {
    return State.get<ConsoleStateState>()
      .map(({ input }) => input[0] ?? '')
      .modify(s => s.copy({ input: s.input.slice(1) }));
  }

  public print<A>(
    a: A,
    S: Show<A> = Show.fromToString<A>(),
  ): ConsoleState<void> {
    return State.modify<ConsoleStateState>(s =>
      s.copy({ output: [...s.output, S.show(a)] }),
    );
  }

  public printLn<A>(
    a: A,
    S: Show<A> = Show.fromToString<A>(),
  ): ConsoleState<void> {
    return State.modify<ConsoleStateState>(s =>
      s.copy({ output: [...s.output, S.show(a)] }),
    );
  }

  public error<A>(
    a: A,
    S: Show<A> = Show.fromToString<A>(),
  ): ConsoleState<void> {
    return State.modify<ConsoleStateState>(s =>
      s.copy({ error: [...s.error, S.show(a)] }),
    );
  }

  public errorLn<A>(
    a: A,
    S: Show<A> = Show.fromToString<A>(),
  ): ConsoleState<void> {
    return State.modify<ConsoleStateState>(s =>
      s.copy({ error: [...s.error, S.show(a)] }),
    );
  }
}

export class ConsoleStateState {
  public static readonly empty = new ConsoleStateState([], [], []);
  public static withInput(input: string[]): ConsoleStateState {
    return new ConsoleStateState(input, [], []);
  }

  public constructor(
    public readonly input: string[],
    public readonly output: string[],
    public readonly error: string[],
  ) {}

  public copy({
    input = this.input,
    output = this.output,
    error = this.error,
  }: Partial<Props> = {}): ConsoleStateState {
    return new ConsoleStateState(input, output, error);
  }
}

type Props = {
  readonly input: string[];
  readonly output: string[];
  readonly error: string[];
};
