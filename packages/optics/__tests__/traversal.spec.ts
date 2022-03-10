// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eq, List, Map, Monoid, None, Option, Ord, Some } from '@fp4ts/cats';
import { At, Iso, Lens, Traversal } from '@fp4ts/optics-core';
import { SetterSuite, TraversalSuite } from '@fp4ts/optics-laws';
import { checkAll, forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Traversal', () => {
  interface Location {
    readonly latitude: number;
    readonly longitude: number;
    readonly name: string;
  }
  const Location = (
    latitude: number,
    longitude: number,
    name: string,
  ): Location => ({ latitude, longitude, name });

  const coordinates = Lens.fromProps<Location>()('latitude', 'longitude');

  const eachL = <A>(): Traversal<List<A>, A> =>
    Traversal.fromTraversable(List.Traversable)<A>();
  const eachLi = eachL<number>();

  const locationArb: Arbitrary<Location> = fc
    .tuple(fc.integer(), fc.integer(), fc.string())
    .map(([latitude, longitude, name]) => ({ latitude, longitude, name }));

  const locationEq: Eq<Location> = Eq.struct({
    latitude: Eq.fromUniversalEquals<number>(),
    longitude: Eq.fromUniversalEquals<number>(),
    name: Eq.fromUniversalEquals<string>(),
  });

  it('should compose', () => {
    expect(
      eachL<Location>()
        .andThen(coordinates)
        .modify(({ longitude, latitude }) => ({
          latitude: latitude + 1,
          longitude: longitude + 1,
        }))(List(Location(1, 2, 'a'), Location(3, 4, 'b'))),
    ).toEqual(List(Location(2, 3, 'a'), Location(4, 5, 'b')));
  });

  test(
    'foldMap',
    forAll(
      A.fp4tsList(fc.integer()),
      xs =>
        eachLi.foldMap(Monoid.string)(x => `${x}`)(xs) ===
        xs.foldMap(Monoid.string)(x => `${x}`),
    ),
  );

  test(
    'getAll',
    forAll(A.fp4tsList(fc.integer()), xs =>
      eachLi.getAll(xs).equals(Eq.primitive, xs),
    ),
  );

  test(
    'headOption',
    forAll(A.fp4tsList(fc.integer()), xs =>
      eachLi.headOption(xs).equals(Eq.primitive, xs.headOption),
    ),
  );

  test(
    'lastOption',
    forAll(A.fp4tsList(fc.integer()), xs =>
      eachLi.lastOption(xs).equals(Eq.primitive, xs.lastOption),
    ),
  );

  test(
    'size',
    forAll(A.fp4tsList(fc.integer()), xs => eachLi.size(xs) === xs.size),
  );

  test(
    'isEmpty',
    forAll(A.fp4tsList(fc.integer()), xs => eachLi.isEmpty(xs) === xs.isEmpty),
  );

  test(
    'nonEmpty',
    forAll(
      A.fp4tsList(fc.integer()),
      xs => eachLi.nonEmpty(xs) === xs.nonEmpty,
    ),
  );

  test(
    'find',
    forAll(A.fp4tsList(fc.integer()), fc.integer(), (xs, y) =>
      eachLi
        .find(x => x > y)(xs)
        .equals(Eq.primitive, Option(xs.toArray.find(x => x > y))),
    ),
  );

  test(
    'any',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.integer(),
      (xs, y) => eachLi.any(x => x > y)(xs) === xs.any(x => x > y),
    ),
  );

  test(
    'all',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.integer(),
      (xs, y) => eachLi.all(x => x > y)(xs) === xs.all(x => x > y),
    ),
  );

  test(
    'to',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.func<[number], string>(fc.string()),
      (xs, f) => eachLi.to(f).getAll(xs).equals(Eq.primitive, xs.map(f)),
    ),
  );

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
    forAll(
      A.fp4tsList(fc.integer()),
      fc.func<[number], number>(fc.integer()),
      (xs, f) => eachLi.modify(f)(xs).equals(Eq.primitive, xs.map(f)),
    ),
  );

  test(
    'filter',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.func<[number], boolean>(fc.boolean()),
      (xs, f) => eachLi.filter(f).getAll(xs).equals(Eq.primitive, xs.filter(f)),
    ),
  );

  test('at', () => {
    const map = Map([1, 'one']);
    const mapTraversal = Iso.id<Map<number, string>>().asTraversal();
    const at = At.Map<number, string>(Ord.primitive);

    expect(mapTraversal.at(1, at).getAll(map)).toEqual(List(Some('one')));
    expect(mapTraversal.at(0, at).getAll(map)).toEqual(List(None));
    expect(mapTraversal.at(1, at).replace(Some('two'))(map)).toEqual(
      Map([1, 'two']),
    );
    expect(mapTraversal.at(0, at).replace(Some('two'))(map)).toEqual(
      Map([0, 'two'], [1, 'one']),
    );
    expect(mapTraversal.at(1, at).replace(None)(map)).toEqual(Map.empty);
  });

  describe('Laws', () => {
    checkAll(
      'Traversal<List<number>, number>',
      TraversalSuite(eachLi).traversal(
        A.fp4tsList(fc.integer()),
        fc.integer(),
        List.Eq(Eq.primitive),
        Eq.primitive,
      ),
    );

    checkAll(
      'Traversal<List<number>, number> as Setter',
      SetterSuite(eachLi.asSetter()).setter(
        A.fp4tsList(fc.integer()),
        fc.integer(),
        List.Eq(Eq.primitive),
        Eq.primitive,
      ),
    );

    checkAll(
      'Traversal<Location, { longitude: number, latitude: number  }>',
      TraversalSuite(coordinates).traversal(
        locationArb,
        fc.record({ latitude: fc.integer(), longitude: fc.integer() }),
        locationEq,
        Eq.struct({ latitude: Eq.primitive, longitude: Eq.primitive }),
      ),
    );

    checkAll(
      'Traversal<Location, { longitude: number, latitude: number  }> as Setter',
      SetterSuite(coordinates.asSetter()).setter(
        locationArb,
        fc.record({ latitude: fc.integer(), longitude: fc.integer() }),
        locationEq,
        Eq.struct({ latitude: Eq.primitive, longitude: Eq.primitive }),
      ),
    );
  });
});
