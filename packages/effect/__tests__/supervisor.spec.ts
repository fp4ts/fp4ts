// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit/lib/jest-extension';
import { IO, IOOutcome } from '@fp4ts/effect-core';
import { Supervisor } from '@fp4ts/effect-std';

describe('Supervisor', () => {
  it.ticked('should fork a fiber which completes successfully', ticker => {
    const io = Supervisor(IO.Concurrent).use(IO.MonadCancel)(sup =>
      sup.supervise(IO(() => 42)).flatMap(f => f.join),
    );

    expect(io).toCompleteWith(IOOutcome.success(IO.pure(42)), ticker);
  });

  it.ticked('should fork a fiber which throws an error', ticker => {
    const io = Supervisor(IO.Concurrent).use(IO.MonadCancel)(sup =>
      sup
        .supervise(IO.throwError(new Error('test error')))
        .flatMap(f => f.join),
    );

    expect(io).toCompleteWith(
      IOOutcome.failure(new Error('test error')),
      ticker,
    );
  });

  it.ticked('should fork a fiber that self-cancels', ticker => {
    const io = Supervisor(IO.Concurrent).use(IO.MonadCancel)(sup =>
      sup.supervise(IO.canceled).flatMap(f => f.join),
    );

    expect(io).toCompleteWith(IOOutcome.canceled(), ticker);
  });

  it.ticked('should cancel active fiber when supervisor exits', ticker => {
    const io = Supervisor(IO.Concurrent)
      .use(IO.MonadCancel)(sup => sup.supervise(IO.never))
      .flatMap(f => f.join);

    expect(io).toCompleteWith(IOOutcome.canceled(), ticker);
  });
});
