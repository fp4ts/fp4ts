// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe } from '@fp4ts/core';
import { Monad, Option, Some, None } from '@fp4ts/cats';

import { Console, Random, Program } from './dsl';

const checkContinue = <F>(F: Monad<F> & Console<F>): Kind<F, [boolean]> =>
  pipe(
    F.printLn('Do you want to continue? [y/n]'),
    F.productR(F.readLine),
    F.map(ln => ln.toLowerCase()),
    F.flatMap(input =>
      input.startsWith('y')
        ? F.pure(true)
        : input.startsWith('n')
        ? F.pure(false)
        : checkContinue(F),
    ),
  );

const printResults =
  <F>(F: Console<F>) =>
  (hidden: number) =>
  (guess: number): Kind<F, [void]> =>
    guess < hidden
      ? F.printLn('Your guess is too low')
      : guess > hidden
      ? F.printLn('Your guess is too high')
      : F.printLn('Your guess is right!');

export const gameLoop = <F>(
  F: Monad<F> & Console<F> & Random<F>,
): Kind<F, [void]> => {
  const enterGuess: Kind<F, [number]> = pipe(
    F.printLn('Please guess a number between 1 and 100 (inclusive)'),
    F.productR(F.readLine),
    F.map(parseIntOption),
    F.flatMap(guess => guess.fold(() => enterGuess, F.pure)),
  );

  const guessLoop = (hidden: number): Kind<F, [void]> =>
    pipe(
      F.Do,
      F.bindTo('guess', enterGuess),
      F.bindTo('isCorrect', ({ guess }) => F.pure(guess === hidden)),
      F.bind(({ guess }) => printResults(F)(hidden)(guess)),
      F.flatMap(({ isCorrect }) => (isCorrect ? F.unit : guessLoop(hidden))),
    );

  return pipe(
    F.Do,
    F.bindTo('hidden', F.nextIntBetween(1, 101)),
    F.bind(({ hidden }) => guessLoop(hidden)),
    F.bindTo('cont', checkContinue(F)),
    F.flatMap(({ cont }) => (cont ? gameLoop(F) : F.unit)),
  );
};

export const run = <F>(F: Program<F>): Kind<F, [void]> => gameLoop(F);

// -- utilities

const parseIntOption = (s: string): Option<number> => {
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? None : Some(n);
};
