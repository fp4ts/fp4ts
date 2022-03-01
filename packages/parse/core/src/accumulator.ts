// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List, ListBuffer } from '@fp4ts/cats';

export interface Accumulator<A, Out> {
  newBuilder(): Builder<A, Out>;
}

export const Accumulator = Object.freeze({
  make: <A, Out>(init: Out, f: (out: Out, a: A) => Out): Accumulator<A, Out> =>
    Accumulator.fromMkBuilder(() => new FoldingBuilder(init, f)),

  fromMkBuilder: <A, Out>(
    builder: () => Builder<A, Out>,
  ): Accumulator<A, Out> => ({ newBuilder: builder }),

  string: (): Accumulator<string, string> =>
    Accumulator.fromMkBuilder(() => new StringBuilder()),

  list: <A>(): Accumulator<A, List<A>> =>
    Accumulator.fromMkBuilder(() => new ListBuilder()),
});

export interface Accumulator1<A, Out> {
  newBuilder(first: A): Builder<A, Out>;
}

// -- Builders

export abstract class Builder<A, X> {
  public abstract append(a: A): this;
  public abstract readonly result: X;

  public mapResult<Y>(f: (x: X) => Y): Builder<A, Y> {
    return new MappedBuilder(this, f);
  }
}

class MappedBuilder<A, X, Y> extends Builder<A, Y> {
  public constructor(
    private readonly self: Builder<A, X>,
    private readonly fun: (x: X) => Y,
  ) {
    super();
  }

  public append(a: A): this {
    this.self.append(a);
    return this;
  }

  public get result(): Y {
    return this.fun(this.self.result);
  }
}

class FoldingBuilder<A, Out> extends Builder<A, Out> {
  public constructor(public result: Out, public fn: (out: Out, a: A) => Out) {
    super();
  }

  public append(a: A): this {
    this.result = this.fn(this.result, a);
    return this;
  }
}

class StringBuilder extends Builder<string, string> {
  public constructor(public result: string = '') {
    super();
  }

  public append(a: string): this {
    this.result += a;
    return this;
  }
}

class ListBuilder<A> extends Builder<A, List<A>> {
  private buffer: ListBuffer<A> = new ListBuffer<A>();

  public get result(): List<A> {
    return this.buffer.toList;
  }

  public append(a: A): this {
    this.buffer.addOne(a);
    return this;
  }
}
