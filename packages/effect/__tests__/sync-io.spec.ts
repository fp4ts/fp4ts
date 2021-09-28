import { pipe, throwError } from '@cats4ts/core';
import { SyncIO } from '@cats4ts/effect-core';

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

  it('should map element', () => {
    expect(
      SyncIO(() => 42)
        .map(x => x * 2)
        .unsafeRunSync(),
    ).toBe(84);
  });

  it('should map element', () => {
    expect(
      SyncIO(() => 42)
        .map(x => x * 2)
        .flatMap(x => SyncIO(() => x + 1))
        .map(x => x + 2)
        .unsafeRunSync(),
    ).toBe(87);
  });

  it('should skip over the error failure when successful', () => {
    expect(
      SyncIO(() => 42)
        .handleErrorWith(() => SyncIO.pure(94))
        .map(x => x * 2)
        .unsafeRunSync(),
    ).toBe(84);
  });
});
