// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, List, Map, None, Ord, Some } from '@fp4ts/cats';
import { At, Iso, PSetter, Setter } from '@fp4ts/optics-core';
import { SetterSuite } from '@fp4ts/optics-laws';
import { checkAll, forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Setter', () => {
  const eachL = <A>(): Setter<List<A>, A> =>
    PSetter.fromFunctor<A, A>()(List.Functor);

  const eachLi: Setter<List<number>, number> = eachL<number>();

  it('should compose', () => {
    expect(
      eachL<List<number>>().andThen(eachLi).replace(3)(
        List(List(1, 2, 3), List(3)),
      ),
    ).toEqual(List(List(3, 3, 3), List(3)));
  });

  test(
    'replace',
    forAll(A.fp4tsList(fc.integer()), xs =>
      eachLi
        .replace(0)(xs)
        .equals(
          Eq.primitive,
          xs.map(() => 0),
        ),
    ),
  );

  test(
    'modify',
    forAll(A.fp4tsList(fc.integer()), xs =>
      eachLi
        .modify(x => x + 1)(xs)
        .equals(
          Eq.primitive,
          xs.map(x => x + 1),
        ),
    ),
  );

  test(
    'filter',
    forAll(A.fp4tsList(fc.integer()), xs =>
      eachLi
        .filter(x => x % 2 === 0)
        .replace(0)(xs)
        .equals(
          Eq.primitive,
          xs.map(x => (x % 2 === 0 ? 0 : x)),
        ),
    ),
  );

  test('at', () => {
    const map = Map([1, 'one']);
    const mapSetter = Iso.id<Map<number, string>>();
    const at = At.Map<number, string>(Ord.primitive);

    expect(mapSetter.at(1, at).replace(Some('two'))(map)).toEqual(
      Map([1, 'two']),
    );
    expect(mapSetter.at(0, at).replace(Some('two'))(map)).toEqual(
      Map([1, 'one'], [0, 'two']),
    );
    expect(mapSetter.at(1, at).replace(None)(map)).toEqual(Map.empty);
  });

  describe('Laws', () => {
    const setterTests = SetterSuite(eachLi);
    checkAll(
      'Setter<List<number>, number>',
      setterTests.setter(
        A.fp4tsList(fc.integer()),
        fc.integer(),
        List.Eq(Eq.primitive),
        Eq.primitive,
      ),
    );
  });
});
