// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { List, Monoid, Option } from '@fp4ts/cats';
import { Reader, State } from '@fp4ts/mtl';
import {
  Fold,
  filtered,
  folded,
  foldMap,
  foldRight_,
  foldLeft,
  headOption,
  lastOption,
  size,
  isEmpty,
  nonEmpty,
  find,
  any,
  all,
  to,
  preview,
  preuse,
  ifoldRight_,
  ifolded,
  ifoldLeft,
} from '@fp4ts/optics-core';
import { toList } from '@fp4ts/optics-std';
import { forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Fold', () => {
  const eachli = folded(List.Foldable)<number>();

  const nestedListFold = <A>(): Fold<List<List<A>>, List<A>> =>
    folded(List.Foldable)<List<A>>();

  it('should compose', () => {
    expect(
      nestedListFold<number>().compose(eachli).apply(toList)(
        List(List(1, 2, 3), List(4, 5, 6)),
      ),
    ).toEqual(List(1, 2, 3, 4, 5, 6));
  });

  test(
    'foldMap',
    forAll(
      A.fp4tsList(fc.integer()),
      xs =>
        eachli.apply(foldMap)(Monoid.string)(x => `${x}`)(xs) ===
        xs.foldMap(Monoid.string, x => `${x}`),
    ),
  );

  test(
    'foldRight',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.func<[number, string], string>(fc.string()),
      (xs, f) => eachli.apply(foldRight_)('', f)(xs) === xs.foldRight_('', f),
    ),
  );

  test(
    'foldLeft',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.func<[string, number], string>(fc.string()),
      (xs, f) => eachli.apply(foldLeft)('', f)(xs) === xs.foldLeft('', f),
    ),
  );

  test(
    'getAll',
    forAll(A.fp4tsList(fc.integer()), xs =>
      eachli.apply(toList)(xs).equals(xs),
    ),
  );

  test(
    'headOption',
    forAll(A.fp4tsList(fc.integer()), xs =>
      eachli.apply(headOption)(xs).equals(xs.headOption),
    ),
  );

  test(
    'lastOption',
    forAll(A.fp4tsList(fc.integer()), xs =>
      eachli.apply(lastOption)(xs).equals(xs.lastOption),
    ),
  );

  test(
    'size',
    forAll(A.fp4tsList(fc.integer()), xs => eachli.apply(size)(xs) === xs.size),
  );

  test(
    'isEmpty',
    forAll(
      A.fp4tsList(fc.integer()),
      xs => eachli.apply(isEmpty)(xs) === xs.isEmpty,
    ),
  );

  test(
    'nonEmpty',
    forAll(
      A.fp4tsList(fc.integer()),
      xs => eachli.apply(nonEmpty)(xs) === xs.nonEmpty,
    ),
  );

  test(
    'find',
    forAll(A.fp4tsList(fc.integer()), fc.integer(), (xs, y) =>
      eachli
        .apply(find)(x => x > y)(xs)
        .equals(Option(xs.toArray.find(x => x > y))),
    ),
  );

  test(
    'any',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.integer(),
      (xs, y) => eachli.apply(any)(x => x > y)(xs) === xs.any(x => x > y),
    ),
  );

  test(
    'all',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.integer(),
      (xs, y) => eachli.apply(all)(x => x > y)(xs) === xs.all(x => x > y),
    ),
  );

  test(
    'to',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.func<[number], string>(fc.string()),
      (xs, f) => eachli.compose(to(f)).apply(toList)(xs).equals(xs.map(f)),
    ),
  );

  test('select (satisfied predicate)', () => {
    expect(
      filtered((xs: List<number>) => xs.all(x => x % 2 === 0)).apply(toList)(
        List(2, 4, 6),
      ),
    ).toEqual(List(List(2, 4, 6)));
  });

  test('select (unsatisfied predicate)', () => {
    expect(
      filtered((xs: List<number>) => xs.all(x => x % 2 === 0)).apply(toList)(
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
        eachli.compose(filtered(f)).apply(toList)(xs).equals(xs.filter(f)),
    ),
  );

  test(
    'preview',
    forAll(A.fp4tsList(fc.integer()), xs =>
      expect(
        eachli
          .apply(preview(Reader.MonadReader<List<number>>()))
          .provide(xs)
          .run(),
      ).toEqual(xs.headOption),
    ),
  );

  test(
    'preuse',
    forAll(A.fp4tsList(fc.integer()), xs =>
      expect(
        eachli
          .apply(preuse(State.MonadState<List<number>>()))
          .provideState(xs)
          .run(),
      ).toEqual(xs.headOption),
    ),
  );

  test(
    'ifoldRight',
    forAll(
      fc.array(fc.integer()),
      fc.func<[number, string, number], string>(fc.string()),
      (xs, f) =>
        expect(ifolded<number>().apply(ifoldRight_)('', f)(xs)).toEqual(
          xs.reduceRight((r, x, i) => f(x, r, i), ''),
        ),
    ),
  );

  test(
    'ifoldLeft',
    forAll(
      fc.array(fc.integer()),
      fc.func<[string, number, number], string>(fc.string()),
      (xs, f) =>
        expect(ifolded<number>().apply(ifoldLeft)('', f)(xs)).toEqual(
          xs.reduce((r, x, i) => f(r, x, i), ''),
        ),
    ),
  );

  // test(
  //   'ifilter',
  //   forAll(
  //     fc.array(fc.string()),
  //     fc.func<[number], boolean>(fc.boolean()),
  //     (xs, p) =>
  //       expect(
  //         ifolded<string>()
  //           .ifilter((x, i) => p(i))
  //           .toList(xs),
  //       ).toEqual(List.fromArray(xs.filter((x, i) => p(i)))),
  //   ),
  // );

  // test(
  //   'indexing',
  //   forAll(fc.array(fc.string()), xs =>
  //     expect(
  //       focus<string[]>()
  //         .each()
  //         .filter(x => x.length > 2)
  //         .indexed()
  //         .ifilter((a, i) => i > 1)
  //         .toList(xs),
  //     ).toEqual(List.fromArray(xs.filter(x => x.length > 2).slice(2))),
  //   ),
  // );

  // test('at', () => {
  //   const map = Map([1, 'one']);
  //   const mapFold = Iso.id<Map<number, string>>().asFold();
  //   const at = At.Map<number, string>(Ord.fromUniversalCompare());

  //   expect(mapFold.at(1, at).getAll(map)).toEqual(List(Some('one')));
  //   expect(mapFold.at(0, at).getAll(map)).toEqual(List(None));
  // });
});
