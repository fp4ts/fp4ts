// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eval, id, pipe } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Monad } from '@fp4ts/cats-core';
import { Backwards, Identity } from '@fp4ts/cats-core/lib/data';
import { MonadSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

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
