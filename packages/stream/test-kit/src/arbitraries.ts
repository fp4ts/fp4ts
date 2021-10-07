import fc, { Arbitrary } from 'fast-check';
import { AnyK } from '@cats4ts/core';
import { Stream } from '@cats4ts/stream-core';

export * from '@cats4ts/cats-test-kit/lib/arbitraries';
export * from '@cats4ts/effect-test-kit/lib/arbitraries';

export const cats4tsPureStreamGenerator = <A>(
  arbA: Arbitrary<A>,
): Arbitrary<Stream<AnyK, A>> =>
  fc.frequency(
    {
      weight: 1,
      arbitrary: fc.constant(Stream.empty()),
    },
    {
      weight: 5,
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
