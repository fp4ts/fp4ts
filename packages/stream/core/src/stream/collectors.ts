// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Byte } from '@fp4ts/core';
import { List, Vector } from '@fp4ts/collections';
import { Chunk } from '../chunk';

export interface Collector<in A, Out> {
  newBuilder(): Builder<A, Out>;
}

export abstract class Builder<in A, out X> {
  public abstract append(a: Chunk<A>): this;
  public abstract readonly result: X;

  public mapResult<Y>(f: (x: X) => Y): Builder<A, Y> {
    return new MappedBuilder(this, f);
  }
}

class MappedBuilder<A, Y, X> extends Builder<A, X> {
  public constructor(
    public readonly self: Builder<A, Y>,
    public readonly f: (y: Y) => X,
  ) {
    super();
  }

  public get result(): X {
    return this.f(this.self.result);
  }

  public append(a: Chunk<A>): this {
    this.self.append(a);
    return this;
  }
}

export const Collector = Object.freeze({
  make: <A, Out>(builder: () => Builder<A, Out>): Collector<A, Out> => ({
    newBuilder: builder,
  }),

  array: <A>(): Collector<A, A[]> =>
    Collector.make(() => new ChunkBuilder<A>().mapResult(x => x.toArray)),

  list: <A>(): Collector<A, List<A>> =>
    Collector.make(() => new ChunkBuilder<A>().mapResult(x => x.toList)),

  vector: <A>(): Collector<A, Vector<A>> =>
    Collector.make(() => new ChunkBuilder<A>().mapResult(x => x.toVector)),

  string: (): Collector<string, string> =>
    Collector.make(() => new StringBuilder()),

  buffer: (): Collector<Byte, Buffer> =>
    Collector.make(() => new ChunkBuilder<Byte>().mapResult(x => x.toBuffer())),
  uint8Array: (): Collector<Byte, Uint8Array> =>
    Collector.make(() =>
      new ChunkBuilder<Byte>().mapResult(x => x.toUint8Array()),
    ),
  arrayBuffer: (): Collector<Byte, ArrayBuffer> =>
    Collector.make(() =>
      new ChunkBuilder<Byte>().mapResult(x => x.toArrayBuffer()),
    ),
});

class ChunkBuilder<A> extends Builder<A, Chunk<A>> {
  public override result: Chunk<A> = Chunk.empty;

  override append(other: Chunk<A>) {
    this.result = this.result['+++'](other);
    return this;
  }
}

class StringBuilder extends Builder<string, string> {
  public override result: string = '';

  override append(other: Chunk<string>) {
    this.result += other.toArray.join('');
    return this;
  }
}
