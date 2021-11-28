// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { FunctionK } from '@fp4ts/cats';
import { Sync } from './sync';

export abstract class Ref<F, A> {
  private readonly __void!: void;

  public abstract get(): Kind<F, [A]>;

  public abstract set(x: A): Kind<F, [void]>;

  public abstract update(f: (a: A) => A): Kind<F, [void]>;

  public abstract updateAndGet(f: (a: A) => A): Kind<F, [A]>;

  public abstract modify<B>(f: (a: A) => [A, B]): Kind<F, [B]>;

  public mapK<G>(nt: FunctionK<F, G>): Ref<G, A> {
    return new TransformerRef(nt, this);
  }

  public static readonly of =
    <F>(F: Sync<F>) =>
    <B>(x: B): Kind<F, [Ref<F, B>]> =>
      F.delay(() => new SyncRef(F, x));
}

// Private

class SyncRef<F, A> extends Ref<F, A> {
  public constructor(private readonly F: Sync<F>, private value: A) {
    super();
  }

  public get(): Kind<F, [A]> {
    return this.F.delay(() => this.value);
  }

  public set(x: A): Kind<F, [void]> {
    return this.F.delay(() => {
      this.value = x;
    });
  }

  public update(f: (a: A) => A): Kind<F, [void]> {
    return this.F.delay(() => {
      this.value = f(this.value);
    });
  }

  public updateAndGet(f: (a: A) => A): Kind<F, [A]> {
    return this.F.delay(() => (this.value = f(this.value)));
  }

  public modify<B>(f: (a: A) => [A, B]): Kind<F, [B]> {
    return this.F.delay(() => {
      const [x, r] = f(this.value);
      this.value = x;
      return r;
    });
  }
}

class TransformerRef<G, F, A> extends Ref<G, A> {
  public constructor(
    private readonly nt: FunctionK<F, G>,
    private readonly underlying: Ref<F, A>,
  ) {
    super();
  }

  public override get(): Kind<G, [A]> {
    return this.nt(this.underlying.get());
  }

  public override set(x: A): Kind<G, [void]> {
    return this.nt(this.underlying.set(x));
  }

  public override update(f: (a: A) => A): Kind<G, [void]> {
    return this.nt(this.underlying.update(f));
  }

  public override updateAndGet(f: (a: A) => A): Kind<G, [A]> {
    return this.nt(this.underlying.updateAndGet(f));
  }

  public override modify<B>(f: (a: A) => [A, B]): Kind<G, [B]> {
    return this.nt(this.underlying.modify(f));
  }
}
