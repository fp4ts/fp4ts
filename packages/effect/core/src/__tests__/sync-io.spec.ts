import { pipe, throwError } from '@cats4ts/core';
import { SyncIO } from '../sync-io';

describe('SyncIO', () => {
  describe('free monad', () => {
    it('should produce a pure value', () => {
      expect(SyncIO.pure(42).unsafeRunSync()).toBe(42);
    });

    it('should sequence two effects', () => {
      let i: number = 0;

      const fa = pipe(
        SyncIO.pure(42).flatMap(i2 =>
          SyncIO(() => {
            i = i2;
          }),
        ),
      );

      expect(fa.unsafeRunSync()).toBe(undefined);
      expect(i).toBe(42);
    });
  });

  it('should recover from error', () => {
    expect(
      SyncIO(() => throwError(new Error('test error')))
        .map(() => 42)
        .handleErrorWith(() => SyncIO.pure(43))
        .unsafeRunSync(),
    ).toBe(43);
  });
});
