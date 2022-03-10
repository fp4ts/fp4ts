// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, List, Map, Monoid, None, Option, Ord, Some } from '@fp4ts/cats';
import { At, Fold, Iso } from '@fp4ts/optics-core';
import { forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Fold', () => {
  const eachli = Fold.fromFoldable(List.Foldable)<number>();

  const nestedListFold = <A>(): Fold<List<List<A>>, List<A>> =>
    new Fold(
      <M>(M: Monoid<M>) =>
        (f: (xs: List<A>) => M) =>
        s =>
          s.foldMap(M)(f),
    );

  it('should compose', () => {
    expect(
      nestedListFold<number>()
        .andThen(eachli)
        .getAll(List(List(1, 2, 3), List(4, 5, 6))),
    ).toEqual(List(1, 2, 3, 4, 5, 6));
  });

  test(
    'foldMap',
    forAll(
      A.fp4tsList(fc.integer()),
      xs =>
        eachli.foldMap(Monoid.string)(x => `${x}`)(xs) ===
        xs.foldMap(Monoid.string)(x => `${x}`),
    ),
  );

  test(
    'getAll',
    forAll(A.fp4tsList(fc.integer()), xs =>
      eachli.getAll(xs).equals(Eq.primitive, xs),
    ),
  );

  test(
    'headOption',
    forAll(A.fp4tsList(fc.integer()), xs =>
      eachli.headOption(xs).equals(Eq.primitive, xs.headOption),
    ),
  );

  test(
    'lastOption',
    forAll(A.fp4tsList(fc.integer()), xs =>
      eachli.lastOption(xs).equals(Eq.primitive, xs.lastOption),
    ),
  );

  test(
    'size',
    forAll(A.fp4tsList(fc.integer()), xs => eachli.size(xs) === xs.size),
  );

  test(
    'isEmpty',
    forAll(A.fp4tsList(fc.integer()), xs => eachli.isEmpty(xs) === xs.isEmpty),
  );

  test(
    'nonEmpty',
    forAll(
      A.fp4tsList(fc.integer()),
      xs => eachli.nonEmpty(xs) === xs.nonEmpty,
    ),
  );

  test(
    'find',
    forAll(A.fp4tsList(fc.integer()), fc.integer(), (xs, y) =>
      eachli
        .find(x => x > y)(xs)
        .equals(Eq.primitive, Option(xs.toArray.find(x => x > y))),
    ),
  );

  test(
    'any',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.integer(),
      (xs, y) => eachli.any(x => x > y)(xs) === xs.any(x => x > y),
    ),
  );

  test(
    'all',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.integer(),
      (xs, y) => eachli.all(x => x > y)(xs) === xs.all(x => x > y),
    ),
  );

  test(
    'to',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.func<[number], string>(fc.string()),
      (xs, f) => eachli.to(f).getAll(xs).equals(Eq.primitive, xs.map(f)),
    ),
  );

  test('select (satisfied predicate)', () => {
    expect(
      Fold.select((xs: List<number>) => xs.all(x => x % 2 === 0)).getAll(
        List(2, 4, 6),
      ),
    ).toEqual(List(List(2, 4, 6)));
  });

  test('select (unsatisfied predicate)', () => {
    expect(
      Fold.select((xs: List<number>) => xs.all(x => x % 2 === 0)).getAll(
        List(1, 3, 5),
      ),
    ).toEqual(List.empty);
  });

  test(
    'filter',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.func<[number], boolean>(fc.boolean()),
      (xs, f) => eachli.filter(f).getAll(xs).equals(Eq.primitive, xs.filter(f)),
    ),
  );

  test('at', () => {
    const map = Map([1, 'one']);
    const mapFold = Iso.id<Map<number, string>>().asFold();
    const at = At.Map<number, string>(Ord.primitive);

    expect(mapFold.at(1, at).getAll(map)).toEqual(List(Some('one')));
    expect(mapFold.at(0, at).getAll(map)).toEqual(List(None));
  });
});
