// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ok as assert } from 'assert';
import { Kind } from '@fp4ts/core';
import { FunctionK } from '@fp4ts/cats';
import { Sync } from '@fp4ts/effect-kernel';

export abstract class Random<F> {
  abstract nextInt(): Kind<F, [number]>;
  abstract nextIntBetween(min: number, max: number): Kind<F, [number]>;

  public mapK<G>(nt: FunctionK<F, G>): Random<G> {
    return new TranslateRandom(this, nt);
  }

  public static make<F>(F: Sync<F>): Random<F> {
    return new SyncRandom(F);
  }
}

class SyncRandom<F> extends Random<F> {
  public constructor(private readonly F: Sync<F>) {
    super();
  }

  public nextInt(): Kind<F, [number]> {
    return this.nextIntBetween(
      Number.MIN_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER,
    );
  }

  public nextIntBetween(min: number, max: number): Kind<F, [void]> {
    assert(min <= max, 'lower has to be <= upper');
    return this.F.delay(() =>
      Math.floor(Math.random() * (max - min + 1) + min),
    );
  }
}

class TranslateRandom<F, G> extends Random<G> {
  public constructor(
    private readonly wrapped: Random<F>,
    private readonly nt: FunctionK<F, G>,
  ) {
    super();
  }

  public nextInt(): Kind<G, [number]> {
    return this.nt(this.wrapped.nextInt());
  }

  public nextIntBetween(min: number, max: number): Kind<G, [number]> {
    return this.nt(this.wrapped.nextIntBetween(min, max));
  }
}
