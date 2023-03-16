// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eval, id, pipe } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Monad, Traversable } from '@fp4ts/cats-core';
import {
  Backwards,
  Identity,
  Kleisli,
  None,
  Option,
} from '@fp4ts/cats-core/lib/data';
import { MonadSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import { foldRightTraverse } from './helpers/fold-right-traverse';

describe('Backwards', () => {
  it('should execute the effects in reversed order', () => {
    const F = Backwards.Applicative(Monad.Eval);
    let acc = '';

    pipe(
      F.product_(
        Eval.delay(() => (acc += ' my first action')),
        Eval.delay(() => (acc += 'my second action')),
      ),
    ).value;

    expect(acc).toBe('my second action my first action');
  });

  it('short executes in reverse on identity', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys: number[] = [];

    Traversable.Array.traverse_(Backwards.Applicative(Identity.Monad))(
      xs,
      x => (ys.push(x), x),
    );

    expect(ys).toEqual([5, 4, 3, 2, 1]);
  });

  it('short short-circuits with Option', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys: number[] = [];

    Traversable.Array.traverse_(Backwards.Applicative(Option.Monad))(
      xs,
      x => (ys.push(x), None),
    );

    expect(ys).toEqual([5]);
  });

  it('short short-circuits with Kleisli Option', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys: number[] = [];

    Traversable.Array.traverse_(
      Backwards.Applicative(Kleisli.Monad(Option.Monad)),
    )(
      xs,
      x => (ys.push(x), _ => None),
    )(null);

    expect(ys).toEqual([5]);
  });

  it('should be stack safe on Identity', () => {
    const xs = [...new Array(50_000).keys()];
    expect(
      foldRightTraverse(Backwards.Applicative(Identity.Monad), xs, id),
    ).toEqual(xs);
  });

  it('should be stack safe on Eval', () => {
    const xs = [...new Array(50_000).keys()];
    expect(
      foldRightTraverse(Backwards.Applicative(Monad.Eval), xs, Eval.now).value,
    ).toEqual(xs);
  });

  it('should be stack safe on Kleisli Identity', () => {
    const xs = [...new Array(50_000).keys()];
    expect(
      foldRightTraverse(
        Backwards.Applicative(Kleisli.Monad(Identity.Monad)),
        xs,
        x => _ => x,
      )(null),
    ).toEqual(xs);
  });

  it('should be stack safe on Kleisli Eval', () => {
    const xs = [...new Array(50_000).keys()];
    expect(
      foldRightTraverse(
        Backwards.Applicative(Kleisli.Monad(Monad.Eval)),
        xs,
        x => _ => Eval.now(x),
      )(null).value,
    ).toEqual(xs);
  });

  checkAll(
    'Backwards.Monad<Identity>',
    MonadSuite(Backwards.Monad(Identity.Monad)).monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      id,
      id,
    ),
  );

  checkAll(
    'Backwards.Monad<Eval>',
    MonadSuite(Backwards.Monad(Monad.Eval)).monad(
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
