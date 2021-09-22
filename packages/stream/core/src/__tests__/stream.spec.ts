import { List } from '@cats4ts/cats-core/lib/data';
import { IO, IoK } from '@cats4ts/effect-core';
import { Stream } from '../stream';

describe('Stream', () => {
  it('should turn list into a stream and back', async () => {
    const p = await Stream.fromList<IoK, number>(List(1, 2, 3, 4, 5))
      .compile(IO.MonadError)
      .fold(List.empty as List<number>, (xs, x) => xs.prepend(x))
      .map(xs => xs.reverse)
      .unsafeRunToPromise();

    expect(p).toEqual(List(1, 2, 3, 4, 5));
  });

  it('should turn list into a stream double elements and put and back', async () => {
    const p = await Stream.fromList<IoK, number>(List(1, 2, 3, 4, 5))
      .map(x => x * 2)
      .compile(IO.MonadError)
      .fold(List.empty as List<number>, (xs, x) => xs.prepend(x))
      .map(xs => xs.reverse)
      .unsafeRunToPromise();

    expect(p).toEqual(List(2, 4, 6, 8, 10));
  });

  it('should duplicate the elements of the list', async () => {
    const p = await Stream.fromList<IoK, number>(List(1, 2, 3))
      .flatMap(x => Stream.of(x, x))
      .compile(IO.MonadError)
      .fold(List.empty as List<number>, (xs, x) => xs.prepend(x))
      .map(xs => xs.reverse)
      .unsafeRunToPromise();

    expect(p).toEqual(List(1, 1, 2, 2, 3, 3));
  });
});
