import { List, Vector } from '@cats4ts/cats-core/lib/data';
import { Chunk } from '../chunk';

export interface Collector<A, Out> {
  newBuilder(): Builder<A, Out>;
}

export abstract class Builder<A, X> {
  public abstract append(a: Chunk<A>): this;
  public abstract readonly result: X;

  public mapResult<Y>(f: (x: X) => Y): Builder<A, Y> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return new (class extends Builder<A, Y> {
      public override append(a: Chunk<A>) {
        self.append(a);
        return this;
      }

      public override get result() {
        return f(self.result);
      }
    })();
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
});

class ChunkBuilder<A> extends Builder<A, Chunk<A>> {
  public override result: Chunk<A> = Chunk.empty;

  override append(other: Chunk<A>) {
    this.result = this.result['+++'](other);
    return this;
  }
}

class StringBuilder<A> extends Builder<string, string> {
  public override result: string = '';

  override append(other: Chunk<string>) {
    this.result = other.foldLeft(this.result, (x, y) => x + y);
    return this;
  }
}
