import '@cats4ts/effect-test-kit/lib/jest-extension';
import fc from 'fast-check';
import { Eq, List, Either } from '@cats4ts/cats';
import { MonadCancelSuite } from '@cats4ts/effect-laws';
import { IO, IoK } from '@cats4ts/effect-core';
import { Resource } from '@cats4ts/effect-kernel';
import * as A from '@cats4ts/effect-test-kit/lib/arbitraries';
import * as E from '@cats4ts/effect-test-kit/lib/eq';
import { checkAll, forAll, IsEq } from '@cats4ts/cats-test-kit';
import { use } from '@cats4ts/effect-kernel/lib/resource/operators';
import { fst } from '@cats4ts/core';

describe('Resource', () => {
  describe('$<ResourceK, [IO]>', () => {
    const Instance = Resource.MonadCancel(IO.Async);

    it.ticked('should release resources in reversed order', ticker => {
      const arb = A.cats4tsList(
        fc.tuple(
          fc.integer(),
          A.cats4tsEither(A.cats4tsError(), fc.constant<void>(undefined)),
        ),
      );

      forAll(arb, as => {
        let released: List<number> = List.empty;
        const r = as.traverse(Instance)(([a, e]) =>
          Resource.make(IO.Functor)(
            IO(() => a),
            a =>
              IO(() => (released = released.prepend(a)))['>>>'](
                IO.fromEither(e),
              ),
          ),
        );

        expect(r.use_(IO.MonadCancel).attempt.void).toCompleteWith(
          undefined,
          ticker,
        );
        return new IsEq(released, as.map(fst));
      })(List.Eq(Eq.primitive))();
    });

    it.ticked('should testttt', ticker => {
      const as: List<[number, Either<Error, void>]> = List(
        [0, Either.rightUnit],
        [1, Either.rightUnit],
      );

      let released: List<number> = List.empty;
      const r = as.traverse(Instance)(([a, e]) =>
        Resource.make(IO.Functor)(
          IO(() => a),
          a =>
            IO(() => (released = released.prepend(a)))['>>>'](IO.fromEither(e)),
        ),
      );

      expect(r.use_(IO.MonadCancel).attempt.void).toCompleteWith(
        undefined,
        ticker,
      );
      expect(released.toArray).toEqual(as.map(fst).toArray);
    });

    it.ticked('should do something', ticker => {
      const xs = List<[number, Either<Error, void>]>(
        [0, Either.rightUnit],
        [1, Either.rightUnit],
      );

      let released: List<number> = List.empty;
      const lhs = Resource.make(IO.Functor)(
        IO(() => 0),
        a => IO(() => (released = released.prepend(a)))['>>>'](IO.unit),
      );
      const rhs = Resource.make(IO.Functor)(
        IO(() => 1),
        a => IO(() => (released = released.prepend(a)))['>>>'](IO.unit),
      );

      const r = lhs.flatMap(() => rhs.map(() => {}));

      expect(r.use_(IO.MonadCancel).attempt.void).toCompleteWith(
        undefined,
        ticker,
      );
      expect(released.toArray).toEqual([0, 1]);
    });
  });

  describe.ticked('Laws', ticker => {
    const resourceIOMonadCancel = Resource.MonadCancel(IO.MonadCancel);
    const monadCancelTests = MonadCancelSuite(resourceIOMonadCancel);

    checkAll(
      'MonadCancel<$<Resource, [IoK]>, Error>',
      monadCancelTests.monadCancel(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        A.cats4tsError(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.Error.strict,
        x => A.cats4tsResource(IO.Functor)(x, A.cats4tsIO),
        <X>(EqX: Eq<X>) =>
          Eq.by(E.eqIO(EqX, ticker), (r: Resource<IoK, X>) =>
            use(IO.MonadCancel)(IO.pure)(r),
          ),
      ),
    );
  });
});
