import { List } from '@cats4ts/cats-core/lib/data';
import { SyncIoK } from '@cats4ts/effect-core';
import { Stream } from '../stream';

describe('Stream', () => {
  it('should turn list into a stream and back', () => {
    const p = Stream.fromList<SyncIoK, number>(List(1, 2, 3, 4, 5)).compile
      .toList;

    expect(p).toEqual(List(1, 2, 3, 4, 5));
  });

  it('should turn list into a stream double elements and put and back', () => {
    const p = Stream.fromList<SyncIoK, number>(List(1, 2, 3, 4, 5)).map(
      x => x * 2,
    ).compile.toList;

    expect(p).toEqual(List(2, 4, 6, 8, 10));
  });

  it('should duplicate the elements of the list', () => {
    const p = Stream.fromList<SyncIoK, number>(List(1, 2, 3)).flatMap(x =>
      Stream.of(x, x),
    ).compile.toList;

    expect(p).toEqual(List(1, 1, 2, 2, 3, 3));
  });
});
