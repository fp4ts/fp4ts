// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Stream, Chunk, PureF } from '@fp4ts/stream-core';

export * from '@fp4ts/cats-test-kit/lib/arbitraries';
export * from '@fp4ts/effect-test-kit/lib/arbitraries';

export const fp4tsPureStreamGenerator = <A>(
  arbA: Arbitrary<A>,
): Arbitrary<Stream<PureF, A>> =>
  fc.oneof(
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
              Stream.empty() as Stream<PureF, A>,
            ),
          ),
        fc
          .array(fc.array(arbA))
          .map(xss =>
            xss.reduce(
              (acc, xs) => Stream.fromArray(xs)['+++'](acc),
              Stream.empty() as Stream<PureF, A>,
            ),
          ),
      ),
    },
  );

export const fp4tsEffectStreamGenerator = <F, A>(
  arbA: Arbitrary<A>,
  arbFA: Arbitrary<Kind<F, [A]>>,
  arbFvoid: Arbitrary<Kind<F, [void]>>,
): Arbitrary<Stream<F, A>> =>
  fc.oneof(
    { maxDepth: 5 },
    { weight: 1, arbitrary: fc.constant(Stream.empty<F>()) },
    {
      weight: 20,
      arbitrary: fc.oneof(
        fc.array(arbA).map(xs => Stream.fromArray<F, A>(xs).take(10)),
        fc
          .array(arbA)
          .map(xs =>
            Stream.fromArray<F, A>(xs).chunkLimit(1).unchunks.take(10),
          ),
        arbFA.map(Stream.evalF),
        arbFA.chain(resource =>
          arbFvoid.chain(release =>
            fp4tsEffectStreamGenerator(arbA, arbFA, arbFvoid).map(use =>
              Stream.bracket(resource, () => release).flatMap<F, A>(() => use),
            ),
          ),
        ),
      ),
    },
  );

export const fp4tsStreamChunkGenerator = <O>(
  arbO: Arbitrary<O>,
): Arbitrary<Chunk<O>> => {
  const maxDepth = 5;

  const base = fc.oneof(
    { weight: 1, arbitrary: fc.constant(Chunk.empty) },
    { weight: 5, arbitrary: arbO.map(Chunk.singleton) },
    {
      weight: 20,
      arbitrary: fc.oneof(
        fc.array(arbO).map(Chunk.fromArray),
        fc
          .array(arbO)
          .chain(xs =>
            fc
              .integer({ min: 0, max: Math.floor(xs.length / 2) })
              .chain(offset =>
                fc
                  .integer({ min: 0, max: xs.length - offset })
                  .map(len => Chunk.fromArray(xs).slice(offset, len)),
              ),
          ),
      ),
    },
  );

  const queue = fc.memo((depth: number): Arbitrary<Chunk<O>> => {
    if (depth >= maxDepth) return base;
    return fc
      .tuple(gen(depth + 1), gen(depth + 1))
      .map(([pfx, sfx]) => pfx['+++'](Chunk.emptyChain)['+++'](sfx));
  });

  const gen = (depth: number): Arbitrary<Chunk<O>> =>
    fc.oneof(base, queue(depth));

  return gen(0);
};
