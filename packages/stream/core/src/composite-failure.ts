// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ok as assert } from 'assert';
import { Option, Some, None, Either, Left } from '@fp4ts/cats';

export class CompositeFailure extends Error {
  public constructor(public readonly errors: Error[]) {
    super();
    assert(errors.length > 1, 'Composite failure must have at least two items');
  }

  public static from(...errors: [Error, Error, ...Error[]]): CompositeFailure {
    return new CompositeFailure(errors);
  }

  public static fromArray(xs: Error[]): Option<Error> {
    switch (xs.length) {
      case 0:
        return None;
      case 1:
        return Some(xs[0]);
      default:
        return Some(new CompositeFailure(xs));
    }
  }

  public static fromResults(
    fst: Either<Error, void>,
    snd: Either<Error, void>,
  ): Either<Error, void> {
    if (fst.isLeft() && snd.isLeft())
      return Left(new CompositeFailure([fst.getLeft, snd.getLeft]));
    return fst.isLeft() ? fst : snd;
  }
}
