import fc from 'fast-check';
import { List, Eq } from '@cats4ts/cats';
import { Chunk } from '@cats4ts/stream-core';
import { forAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/stream-test-kit/lib/arbitraries';

describe('chunk', () => {
  test(
    'size',
    forAll(
      A.cats4tsStreamChunkGenerator(fc.integer()),
      c => c.size === c.toList.size,
    ),
  );

  test(
    'isEmpty',
    forAll(
      A.cats4tsStreamChunkGenerator(fc.integer()),
      c => c.isEmpty === c.toList.isEmpty,
    ),
  );

  test(
    'take',
    forAll(A.cats4tsStreamChunkGenerator(fc.integer()), fc.integer(), (c, n) =>
      c.take(n).toList['<=>'](c.toList.take(n)),
    )(List.Eq(Eq.primitive)),
  );

  test(
    'takeRight',
    forAll(A.cats4tsStreamChunkGenerator(fc.integer()), fc.integer(), (c, n) =>
      c.takeRight(n).toList['<=>'](c.toList.takeRight(n)),
    )(List.Eq(Eq.primitive)),
  );

  test(
    'drop',
    forAll(A.cats4tsStreamChunkGenerator(fc.integer()), fc.integer(), (c, n) =>
      c.drop(n).toList['<=>'](c.toList.drop(n)),
    )(List.Eq(Eq.primitive)),
  );

  test(
    'dropRight',
    forAll(A.cats4tsStreamChunkGenerator(fc.integer()), fc.integer(), (c, n) =>
      c.dropRight(n).toList['<=>'](c.toList.dropRight(n)),
    )(List.Eq(Eq.primitive)),
  );

  test(
    'concat',
    forAll(
      A.cats4tsStreamChunkGenerator(fc.integer()),
      A.cats4tsStreamChunkGenerator(fc.integer()),
      (c1, c2) =>
        c1['+++'](Chunk.empty)
          ['+++'](c2)
          ['+++'](Chunk.empty)
          .toList['<=>'](c1.toList['+++'](c2.toList)),
    )(List.Eq(Eq.primitive)),
  );
});
