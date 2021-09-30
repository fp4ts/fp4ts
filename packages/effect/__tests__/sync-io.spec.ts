import fc from 'fast-check';
import { id, pipe, throwError } from '@cats4ts/core';
import { Eq, Either, Left, Right } from '@cats4ts/cats';
import { SyncIO } from '@cats4ts/effect-core';
import { forAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/effect-test-kit/lib/arbitraries';
import * as E from '@cats4ts/effect-test-kit/lib/eq';

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

  describe('error handling', () => {
    it('should map successful value', () => {
      expect(
        SyncIO(() => 42)
          .redeem(() => -1, id)
          .unsafeRunSync(),
      ).toBe(42);
    });

    test(
      'attempt is redeem with Left for recover and Right for map',
      forAll(A.cats4tsSyncIO(fc.integer()), ioa =>
        ioa.attempt['<=>'](ioa.redeem<Either<Error, number>>(Left, Right)),
      )(E.eqSyncIO(Either.Eq(Eq.Error.strict, Eq.primitive))),
    );
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
