// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit/lib/jest-extension';
import fc from 'fast-check';
import { Eq } from '@fp4ts/cats';
import { IO, IOOutcome } from '@fp4ts/effect';
import { AsyncSuite } from '@fp4ts/effect-laws';
import { checkAll } from '@fp4ts/cats/test-kit';
import { AsyncGenerators } from '@fp4ts/effect-test-kit/lib/kind-generators';
import * as A from '@fp4ts/effect-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/effect-test-kit/lib/eq';

import { ConnectionIO } from '@fp4ts/sql-core';
import { SqliteTransactor } from '@fp4ts/sql-sqlite';

describe.ticked('ConnectionIO', ticker => {
  const trx = SqliteTransactor.make(IO.Async, ':memory:');
  const KG = AsyncGenerators(
    ConnectionIO.Async,
    A.fp4tsError(),
    A.fp4tsExecutionContext(ticker.ctx),
  );

  checkAll(
    'Async<ConnectionIO>',
    AsyncSuite(ConnectionIO.Async).async(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      ticker.ctx,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.by(eq.eqIOOutcome(eq.eqIO(Eq.fromUniversalEquals(), ticker)), ioa =>
        ioa.fold(IOOutcome.canceled, IOOutcome.failure, x =>
          IOOutcome.success(x.transact(trx)),
        ),
      ),
      X => A.fp4tsKind(X, KG),
      <X>(X: Eq<X>) =>
        Eq.by<ConnectionIO<X>, IO<X>>(eq.eqIO(X, ticker), ioa =>
          ioa.transact(trx),
        ),
    ),
  );
});
