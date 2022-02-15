// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, instance } from '@fp4ts/core';
import { Eval, State, StateF } from '@fp4ts/cats';
import { Program } from '../dsl';
import { run } from '../program';

describe('number guess game', () => {
  it('should guess the number on third try', () => {
    const r = run(StateProgram).runS(Eval.Monad)(
      new TestData(['50', '60', '80', 'n'], [], [80]),
    );

    expect(r.value).toEqual(
      new TestData(
        [],
        [
          'Please guess a number between 1 and 100 (inclusive)',
          'Your guess is too low',
          'Please guess a number between 1 and 100 (inclusive)',
          'Your guess is too low',
          'Please guess a number between 1 and 100 (inclusive)',
          'Your guess is right!',
          'Do you want to continue? [y/n]',
        ],
        [],
      ),
    );
  });

  it('should restart the game when user presses Y', () => {
    const r = run(StateProgram).runS(Eval.Monad)(
      new TestData(['50', 'Y', '50', '75', 'n'], [], [50, 75]),
    );

    expect(r.value).toEqual(
      new TestData(
        [],
        [
          'Please guess a number between 1 and 100 (inclusive)',
          'Your guess is right!',
          'Do you want to continue? [y/n]',
          'Please guess a number between 1 and 100 (inclusive)',
          'Your guess is too low',
          'Please guess a number between 1 and 100 (inclusive)',
          'Your guess is right!',
          'Do you want to continue? [y/n]',
        ],
        [],
      ),
    );
  });

  // State implementation of Program

  type TestDataState = {
    input: string[];
    output: string[];
    randomNumbers: number[];
  };
  class TestData {
    public constructor(
      public readonly input: string[],
      public readonly output: string[],
      public readonly randomNumbers: number[],
    ) {}

    public copy({
      input = this.input,
      output = this.output,
      randomNumbers = this.randomNumbers,
    }: Partial<TestDataState> = {}): TestData {
      return new TestData(input, output, randomNumbers);
    }
  }

  const StateProgram: Program<$<StateF, [TestData]>> = instance({
    ...State.Monad<TestData>(),

    get readLine(): State<TestData, string> {
      return State.get<TestData>()
        .map(Eval.Functor)(td => td.input[0])
        .modify(Eval.Functor)(td => td.copy({ input: td.input.slice(1) }));
    },

    printLn(a: string): State<TestData, void> {
      return State.modify(td => td.copy({ output: [...td.output, a] }));
    },

    nextIntBetween(): State<TestData, number> {
      return State.get<TestData>()
        .map(Eval.Monad)(td => td.randomNumbers[0])
        .modify(Eval.Functor)(td =>
        td.copy({ randomNumbers: td.randomNumbers.slice(1) }),
      );
    },
  });
});
