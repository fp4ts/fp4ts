import fc, { Arbitrary } from 'fast-check';
import { AnyK } from '@cats4ts/core';
import { Stream, Chunk } from '@cats4ts/stream-core';

export * from '@cats4ts/cats-test-kit/lib/arbitraries';
export * from '@cats4ts/effect-test-kit/lib/arbitraries';

export const cats4tsPureStreamGenerator = <A>(
  arbA: Arbitrary<A>,
): Arbitrary<Stream<AnyK, A>> =>
  fc.frequency(
    { weight: 1, arbitrary: fc.constant(Stream.empty()) },
    {
      weight: 20,
      arbitrary: fc.oneof(
        fc.array(arbA).map(Stream.fromArray),
        fc.array(arbA).map(xs => Stream.fromArray(xs).chunkLimit(1).unchunks),
        fc
          .array(fc.array(arbA))
          .map(xss =>
            xss.reduce(
              (acc, xs) => acc['+++'](Stream.fromArray(xs)),
              Stream.empty() as Stream<AnyK, A>,
            ),
          ),
        fc
          .array(fc.array(arbA))
          .map(xss =>
            xss.reduce(
              (acc, xs) => Stream.fromArray(xs)['+++'](acc),
              Stream.empty() as Stream<AnyK, A>,
            ),
          ),
      ),
    },
  );

export const cats4tsStreamChunkGenerator = <O>(
  arbO: Arbitrary<O>,
): Arbitrary<Chunk<O>> => {
  const maxDepth = 5;

  const { chunk } = fc.letrec(tie => ({
    empty: fc.constant(Chunk.empty),
    singleton: arbO.map(Chunk.singleton),
    array: fc.array(arbO).map(Chunk.fromArray),
    arraySlice: fc
      .array(arbO)
      .chain(xs =>
        fc
          .integer(0, Math.floor(xs.length / 2))
          .chain(offset =>
            fc
              .integer(0, xs.length - offset)
              .map(len => Chunk.fromArray(xs).slice(offset, len)),
          ),
      ),
    queue: fc
      .tuple(
        tie('chunk') as Arbitrary<Chunk<O>>,
        tie('chunk') as Arbitrary<Chunk<O>>,
      )
      .map(([pfx, sfx]) => pfx['+++'](Chunk.emptyQueue)['+++'](sfx)),
    chunk: fc.frequency(
      { maxDepth },
      { weight: 1, arbitrary: tie('empty') },
      { weight: 1, arbitrary: tie('singleton') },
      {
        weight: 30,
        arbitrary: fc.oneof(tie('array'), tie('arraySlice'), tie('queue')),
      },
    ),
  }));

  return chunk as Arbitrary<Chunk<O>>;
};
