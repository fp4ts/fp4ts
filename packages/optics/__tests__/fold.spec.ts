// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Array, Eq, List, Monoid, Option } from '@fp4ts/cats';
import { Reader, State } from '@fp4ts/cats-mtl';
import {
  Fold,
  focus,
  fromFoldable,
  filtered,
  fromTraversable,
  fromTraversableWithIndex,
  fromFoldableWithIndex,
} from '@fp4ts/optics-core';
import { forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Fold', () => {
  const eachli = fromFoldable(List.Foldable)((xs: List<number>) => xs);

  const nestedListFold = <A>(): Fold<List<List<A>>, List<A>> =>
    fromFoldable(List.Foldable)((xs: List<List<A>>) => xs);

  it('should compose', () => {
    expect(
      focus(nestedListFold<number>())
        .compose(eachli)
        .toList(List(List(1, 2, 3), List(4, 5, 6))),
    ).toEqual(List(1, 2, 3, 4, 5, 6));
  });

  test(
    'foldMap',
    forAll(
      A.fp4tsList(fc.integer()),
      xs =>
        focus(eachli)
          .asGetting(Monoid.string)
          .foldMap(x => `${x}`)(xs) === xs.foldMap(Monoid.string)(x => `${x}`),
    ),
  );

  test(
    'foldRight',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.func<[number, string], string>(fc.string()),
      (xs, f) => focus(eachli).foldRight('', f)(xs) === xs.foldRight('', f),
    ),
  );

  test(
    'foldLeft',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.func<[string, number], string>(fc.string()),
      (xs, f) => focus(eachli).foldLeft('', f)(xs) === xs.foldLeft('', f),
    ),
  );

  test(
    'getAll',
    forAll(A.fp4tsList(fc.integer()), xs =>
      focus(eachli).toList(xs).equals(Eq.primitive, xs),
    ),
  );

  test(
    'headOption',
    forAll(A.fp4tsList(fc.integer()), xs =>
      focus(eachli).headOption(xs).equals(Eq.primitive, xs.headOption),
    ),
  );

  test(
    'lastOption',
    forAll(A.fp4tsList(fc.integer()), xs =>
      focus(eachli).lastOption(xs).equals(Eq.primitive, xs.lastOption),
    ),
  );

  test(
    'size',
    forAll(A.fp4tsList(fc.integer()), xs => focus(eachli).size(xs) === xs.size),
  );

  test(
    'isEmpty',
    forAll(
      A.fp4tsList(fc.integer()),
      xs => focus(eachli).isEmpty(xs) === xs.isEmpty,
    ),
  );

  test(
    'nonEmpty',
    forAll(
      A.fp4tsList(fc.integer()),
      xs => focus(eachli).nonEmpty(xs) === xs.nonEmpty,
    ),
  );

  test(
    'find',
    forAll(A.fp4tsList(fc.integer()), fc.integer(), (xs, y) =>
      focus(eachli)
        .find(x => x > y)(xs)
        .equals(Eq.primitive, Option(xs.toArray.find(x => x > y))),
    ),
  );

  test(
    'any',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.integer(),
      (xs, y) => focus(eachli).any(x => x > y)(xs) === xs.any(x => x > y),
    ),
  );

  test(
    'all',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.integer(),
      (xs, y) => focus(eachli).all(x => x > y)(xs) === xs.all(x => x > y),
    ),
  );

  test(
    'to',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.func<[number], string>(fc.string()),
      (xs, f) => focus(eachli).to(f).toList(xs).equals(Eq.primitive, xs.map(f)),
    ),
  );

  test('select (satisfied predicate)', () => {
    expect(
      focus(filtered((xs: List<number>) => xs.all(x => x % 2 === 0))).toList(
        List(2, 4, 6),
      ),
    ).toEqual(List(List(2, 4, 6)));
  });

  test('select (unsatisfied predicate)', () => {
    expect(
      focus(filtered((xs: List<number>) => xs.all(x => x % 2 === 0))).toList(
        List(1, 3, 5),
      ),
    ).toEqual(List.empty);
  });

  test(
    'filter',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.func<[number], boolean>(fc.boolean()),
      (xs, f) =>
        focus(eachli).filter(f).toList(xs).equals(Eq.primitive, xs.filter(f)),
    ),
  );

  test(
    'preview',
    forAll(A.fp4tsList(fc.integer()), xs =>
      expect(
        focus(eachli).preview(Reader.MonadReader<List<number>>()).runA(xs),
      ).toEqual(xs.headOption),
    ),
  );

  test(
    'preuse',
    forAll(A.fp4tsList(fc.integer()), xs =>
      expect(
        focus(eachli).preuse(State.MonadState<List<number>>()).runA(null, xs),
      ).toEqual(xs.headOption),
    ),
  );

  describe('backwards', () => {
    test(
      'fold',
      forAll(fc.array(fc.integer()), xs =>
        expect(
          focus(fromFoldable(Array.FoldableWithIndex())<number>())
            .backwards()
            .toList(xs),
        ).toEqual(List.fromArray(xs.reverse())),
      ),
    );

    test(
      'traversal',
      forAll(fc.array(fc.integer()), xs =>
        expect(
          focus(fromTraversable(Array.TraversableWithIndex())<number>())
            .backwards()
            .toList(xs),
        ).toEqual(List.fromArray(xs.reverse())),
      ),
    );

    test(
      'indexed fold',
      forAll(fc.array(fc.integer()), xs =>
        expect(
          focus(fromFoldableWithIndex(Array.FoldableWithIndex())<number>())
            .backwards()
            .toList(xs),
        ).toEqual(List.fromArray(xs.reverse())),
      ),
    );

    test(
      'indexed traversal',
      forAll(fc.array(fc.integer()), xs =>
        expect(
          focus(
            fromTraversableWithIndex(Array.TraversableWithIndex())<number>(),
          )
            .backwards()
            .toList(xs),
        ).toEqual(List.fromArray(xs.reverse())),
      ),
    );
  });

  test(
    'ifoldRight',
    forAll(
      fc.array(fc.integer()),
      fc.func<[number, string, number], string>(fc.string()),
      (xs, f) =>
        expect(
          focus(
            fromFoldableWithIndex(Array.FoldableWithIndex())<number>(),
          ).ifoldRight(
            '',
            f,
          )(xs),
        ).toEqual(xs.reduceRight((r, x, i) => f(x, r, i), '')),
    ),
  );

  test(
    'ifoldLeft',
    forAll(
      fc.array(fc.integer()),
      fc.func<[string, number, number], string>(fc.string()),
      (xs, f) =>
        expect(
          focus(
            fromFoldableWithIndex(Array.FoldableWithIndex())<number>(),
          ).ifoldLeft(
            '',
            f,
          )(xs),
        ).toEqual(xs.reduce((r, x, i) => f(r, x, i), '')),
    ),
  );

  test(
    'ifilter',
    forAll(
      fc.array(fc.string()),
      fc.func<[number], boolean>(fc.boolean()),
      (xs, p) =>
        expect(
          focus(fromFoldableWithIndex(Array.FoldableWithIndex())<string>())
            .ifilter((x, i) => p(i))
            .toList(xs),
        ).toEqual(List.fromArray(xs.filter((x, i) => p(i)))),
    ),
  );

  test(
    'eachIndexed',
    forAll(fc.array(fc.string()), xs =>
      expect(
        focus<string[]>()
          .eachWithIndex()
          .ifilter((a, i) => i % 2 === 0)
          .toList(xs),
      ).toEqual(List.fromArray(xs.filter((a, i) => i % 2 === 0))),
    ),
  );

  test(
    'indexing',
    forAll(fc.array(fc.string()), xs =>
      expect(
        focus<string[]>()
          .each()
          .filter(x => x.length > 2)
          .indexed()
          .ifilter((a, i) => i > 1)
          .toList(xs),
      ).toEqual(List.fromArray(xs.filter(x => x.length > 2).slice(2))),
    ),
  );

  // test('at', () => {
  //   const map = Map([1, 'one']);
  //   const mapFold = Iso.id<Map<number, string>>().asFold();
  //   const at = At.Map<number, string>(Ord.primitive);

  //   expect(mapFold.at(1, at).getAll(map)).toEqual(List(Some('one')));
  //   expect(mapFold.at(0, at).getAll(map)).toEqual(List(None));
  // });
});
