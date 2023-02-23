// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eval } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Comonad, Monad, Unzip } from '@fp4ts/cats-core';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import {
  ComonadSuite,
  DeferSuite,
  MonadDeferSuite,
  UnzipSuite,
} from '@fp4ts/cats-laws';

describe('Eval', () => {
  describe('memoization', () => {
    it('should not call memoized value more than once', () => {
      const fn = jest.fn();
      const e = Eval.always(fn).memoize;

      e.value;
      e.value;

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should memoize flat-mapped value', () => {
      const fn = jest.fn();
      const e1 = Eval.always(fn);
      const e = Eval.unit.flatMap(() => e1).memoize.map(() => {});

      e.value;
      e.value;

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('stack safety', () => {
    const size = 100_000;

    test('flatMap map recursion', () => {
      const loop = (i: number): Eval<number> =>
        i < size ? Eval.now(i + 1).flatMap(loop) : Eval.now(i);

      expect(loop(0).value).toBe(size);
    });

    test('flatMap self recursion', () => {
      let e = Eval.zero;
      for (let i = 0; i < size; i++) {
        e = e.flatMap(x => Eval.now(x + 1));
      }

      expect(e.value).toBe(size);
    });

    test('defer', () => {
      let e = Eval.one;
      for (let i = 0; i < size; i++) {
        const temp = e;
        e = Eval.defer(() => temp.map(() => i + 1));
      }

      expect(e.value).toBe(size);
    });

    // test('memoize', () => {
    //   let e = Eval.one;
    //   for (let i = 0; i < size; i++) {
    //     e = new Memoize(e);
    //   }

    //   expect(e.value).toBe(1);
    // });
  });

  checkAll(
    'Defer<Eval>',
    DeferSuite(Monad.Eval).defer(
      fc.integer(),
      Eq.fromUniversalEquals(),
      A.fp4tsEval,
      Eq.Eval,
    ),
  );

  checkAll(
    'MonadDefer<Eval>',
    MonadDeferSuite(Monad.Eval).monadDefer(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      A.fp4tsEval,
      Eq.Eval,
    ),
  );

  checkAll(
    'Unzip<Eval>',
    UnzipSuite(Unzip.Eval).unzip(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      A.fp4tsEval,
      Eq.Eval,
    ),
  );

  checkAll(
    'Comonad<Eval>',
    ComonadSuite(Comonad.Eval).comonad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      A.fp4tsEval,
      Eq.Eval,
    ),
  );
});
