// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Left, Right } from '@fp4ts/cats';
import { Char, flow, pipe } from '@fp4ts/core';
import { Prism, match, case_ } from '@fp4ts/optics-core';

describe('Matching', () => {
  type A = { type: 'a'; value: Char };
  type B = { type: 'b'; value: string };
  type C = { type: 'c'; value: number };
  type ABC = A | B | C;

  const _A = Prism.filter<ABC, A>((x): x is A => x.type === 'a');
  const _B = Prism.filter<ABC, B>((x): x is B => x.type === 'b');
  const _C = Prism.filter<ABC, C>((x): x is C => x.type === 'c');

  describe('chaining', () => {
    it.each`
      input                           | output
      ${{ type: 'a', value: 'aaaa' }} | ${'AAAA'}
      ${{ type: 'a', value: 'aa' }}   | ${'aa'}
      ${{ type: 'b', value: 'c' }}    | ${'c'}
      ${{ type: 'c', value: '5' }}    | ${'aaaaa'}
    `('should match $input into $output', ({ input, output }) => {
      expect(
        match(input as ABC)
          .case(
            _A.filter(({ value }) => value.length > 2),
            ({ value }) => `${value}`.toUpperCase(),
          )
          .case(_A, ({ value }) => `${value}`)
          .case(_B, ({ value }) => value)
          .case(_C, ({ value }) => 'a'.repeat(value))
          .get(),
      ).toEqual(output);
    });
  });

  describe('function pipe-ing', () => {
    it.each`
      input                           | output
      ${{ type: 'a', value: 'aaaa' }} | ${'AAAA'}
      ${{ type: 'a', value: 'aa' }}   | ${'aa'}
      ${{ type: 'b', value: 'c' }}    | ${'c'}
      ${{ type: 'c', value: '5' }}    | ${'aaaaa'}
    `('should match $input into $output', ({ input, output }) => {
      expect(
        pipe(
          Left(input),
          case_(
            _A.filter(({ value }) => value.length > 2),
            ({ value }) => `${value}`.toUpperCase(),
          ),
          case_(_A, ({ value }) => `${value}`),
          case_(_B, ({ value }) => value),
          case_(_C, ({ value }) => 'a'.repeat(value)),
        ),
      ).toEqual(Right(output));
    });
  });

  describe('function composition', () => {
    it.each`
      input                           | output
      ${{ type: 'a', value: 'aaaa' }} | ${'AAAA'}
      ${{ type: 'a', value: 'aa' }}   | ${'aa'}
      ${{ type: 'b', value: 'c' }}    | ${'c'}
      ${{ type: 'c', value: '5' }}    | ${'aaaaa'}
    `('should match $input into $output', ({ input, output }) => {
      expect(
        flow(
          case_(
            _A.filter(({ value }) => value.length > 2),
            ({ value }) => `${value}`.toUpperCase(),
          ),
          case_(_A, ({ value }) => `${value}`),
          case_(_B, ({ value }) => value),
          case_(_C, ({ value }) => 'a'.repeat(value)),
        )(Left(input)),
      ).toEqual(Right(output));
    });
  });
});
