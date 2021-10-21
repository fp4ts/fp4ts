import fc from 'fast-check';
import { Eq } from '@cats4ts/cats-core';
import { Chain, Option } from '@cats4ts/cats-core/lib/data';
import { forAll, IsEq } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

describe('Chain', () => {
  test(
    'headOption',
    forAll(
      A.cats4tsSeq(fc.integer()),
      xs => new IsEq(Chain.fromSeq(xs).headOption, xs.headOption),
    )(Option.Eq(Eq.primitive)),
  );

  test(
    'lastOption',
    forAll(
      A.cats4tsSeq(fc.integer()),
      xs => new IsEq(Chain.fromSeq(xs).lastOption, xs.lastOption),
    )(Option.Eq(Eq.primitive)),
  );

  test(
    'size to be consistent with toList.size',
    forAll(A.cats4tsChain(fc.integer()), c => c.size === c.toList.size),
  );

  it('should do something', () => {
    expect(Chain(1, 2, 3)['+++'](Chain(4, 5)).toArray).toEqual([1, 2, 3, 4, 5]);
  });
});
