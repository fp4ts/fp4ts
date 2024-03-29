// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { id, tupled } from '@fp4ts/core';
import { Either, Eq, Monoid, Option, Some } from '@fp4ts/cats';
import { LazyList, List, OrdMap, Seq, Vector } from '@fp4ts/collections';
import {
  all,
  any,
  each,
  Each,
  filtered,
  find,
  foldMap,
  headOption,
  IEach,
  iheadOption,
  isEmpty,
  iso,
  iterated,
  lastOption,
  mapAccumL,
  mapAccumR,
  modify,
  nonEmpty,
  repeated,
  replace,
  size,
  to,
  toArray,
  toLazyList,
  Traversal,
} from '@fp4ts/optics-core';
import { lined, pick, toList, worded } from '@fp4ts/optics-std';
import { TraversalSuite } from '@fp4ts/optics-laws';
import { checkAll, forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as CA from '@fp4ts/collections-test-kit/lib/arbitraries';

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

  const coordinates = iso<Location>().compose(pick('latitude', 'longitude'));

  const eachL = <A>(): Traversal<List<A>, A> => Each.List<A>();
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
      eachL<Location>().compose(coordinates).apply(modify)(
        ({ longitude, latitude }) => ({
          latitude: latitude + 1,
          longitude: longitude + 1,
        }),
      )(List(Location(1, 2, 'a'), Location(3, 4, 'b'))),
    ).toEqual(List(Location(2, 3, 'a'), Location(4, 5, 'b')));
  });

  test(
    'foldMap',
    forAll(
      CA.fp4tsList(fc.integer()),
      xs =>
        eachLi.apply(foldMap)(Monoid.string)(x => `${x}`)(xs) ===
        xs.foldMap(Monoid.string, x => `${x}`),
    ),
  );

  test(
    'toList',
    forAll(CA.fp4tsList(fc.integer()), xs =>
      eachLi.apply(toList)(xs).equals(xs),
    ),
  );

  test(
    'headOption',
    forAll(CA.fp4tsList(fc.integer()), xs =>
      eachLi.apply(headOption)(xs).equals(xs.headOption),
    ),
  );

  test(
    'lastOption',
    forAll(CA.fp4tsList(fc.integer()), xs =>
      eachLi.apply(lastOption)(xs).equals(xs.lastOption),
    ),
  );

  test(
    'size',
    forAll(
      CA.fp4tsList(fc.integer()),
      xs => eachLi.apply(size)(xs) === xs.size,
    ),
  );

  test(
    'isEmpty',
    forAll(
      CA.fp4tsList(fc.integer()),
      xs => eachLi.apply(isEmpty)(xs) === xs.isEmpty,
    ),
  );

  test(
    'nonEmpty',
    forAll(
      CA.fp4tsList(fc.integer()),
      xs => eachLi.apply(nonEmpty)(xs) === xs.nonEmpty,
    ),
  );

  test(
    'find',
    forAll(CA.fp4tsList(fc.integer()), fc.integer(), (xs, y) =>
      eachLi
        .apply(find)(x => x > y)(xs)
        .equals(Option(xs.toArray.find(x => x > y))),
    ),
  );

  test(
    'any',
    forAll(
      CA.fp4tsList(fc.integer()),
      fc.integer(),
      (xs, y) => eachLi.apply(any)(x => x > y)(xs) === xs.any(x => x > y),
    ),
  );

  test(
    'all',
    forAll(
      CA.fp4tsList(fc.integer()),
      fc.integer(),
      (xs, y) => eachLi.apply(all)(x => x > y)(xs) === xs.all(x => x > y),
    ),
  );

  test(
    'to',
    forAll(
      CA.fp4tsList(fc.integer()),
      fc.func<[number], string>(fc.string()),
      (xs, f) => eachLi.compose(to(f)).apply(toList)(xs).equals(xs.map(f)),
    ),
  );

  test(
    'replace',
    forAll(CA.fp4tsList(fc.integer()), xs =>
      eachLi
        .apply(replace)(0)(xs)
        .equals(xs.map(() => 0)),
    ),
  );

  test(
    'modify',
    forAll(
      CA.fp4tsList(fc.integer()),
      fc.func<[number], number>(fc.integer()),
      (xs, f) => eachLi.apply(modify)(f)(xs).equals(xs.map(f)),
    ),
  );

  test(
    'filter',
    forAll(
      CA.fp4tsList(fc.integer()),
      fc.func<[number], boolean>(fc.boolean()),
      (xs, f) =>
        eachLi.compose(filtered(f)).apply(toList)(xs).equals(xs.filter(f)),
    ),
  );

  test(
    'mapAccumL',
    forAll(
      CA.fp4tsList(fc.integer()),
      fc.func<[string, number], [number, string]>(
        fc.tuple(fc.integer(), fc.string()),
      ),
      (xs, f) =>
        expect(eachLi.apply(mapAccumL)('', f)(xs)).toEqual(
          xs.foldLeft(
            [List.empty, ''] as [List<number>, string],
            ([ys, y], x) => {
              const [n, s] = f(y, x);
              return tupled(ys.append(n), s);
            },
          ),
        ),
    ),
  );
  test(
    'mapAccumR',
    forAll(
      CA.fp4tsList(fc.integer()),
      fc.func<[string, number], [number, string]>(
        fc.tuple(fc.integer(), fc.string()),
      ),
      (xs, f) =>
        expect(eachLi.apply(mapAccumR)('', f)(xs)).toEqual(
          xs.foldRight_(
            [List.empty, ''] as [List<number>, string],
            (x, [ys, y]) => {
              const [n, s] = f(y, x);
              // we preserve the original order
              return tupled(ys.prepend(n), s);
            },
          ),
        ),
    ),
  );

  test(
    'repeated.taking.toLazyList is repeated.toLazyList.take',
    forAll(fc.integer(), fc.integer({ max: 100 }), (x, n) =>
      expect(repeated<number>().taking(n).apply(toLazyList)(x).toArray).toEqual(
        repeated<number>().apply(toLazyList)(x).take(n).toArray,
      ),
    ),
  );

  test('repeated short-circuits', () => {
    expect(repeated<number>().apply(isEmpty)(42)).toBe(false);
  });

  test(
    'iterated.taking.toLazyList is iterated.toLazyList.take',
    forAll(
      fc.func(fc.integer()),
      fc.integer(),
      fc.integer({ max: 100 }),
      (f, x, n) =>
        expect(
          iterated<number>(f).taking(n).apply(toLazyList)(x).toArray,
        ).toEqual(iterated<number>(f).apply(toLazyList)(x).take(n).toArray),
    ),
  );

  test(
    'iterated.taking.toLazyList is LazyList.iterate.take',
    forAll(
      fc.func(fc.integer()),
      fc.integer(),
      fc.integer({ max: 100 }),
      (f, x, n) =>
        expect(
          iterated<number>(f).taking(n).apply(toLazyList)(x).toArray,
        ).toEqual(LazyList.iterate(x, f).take(n).toArray),
    ),
  );

  test('iterated short-circuits', () => {
    expect(iterated<number>(id).apply(isEmpty)(42)).toBe(false);
  });

  test('iterated is lazy', () => {
    let inc = 0;
    expect(iterated<number>(_ => inc++).apply(isEmpty)(42)).toBe(false);
    expect(inc).toBe(0);
  });

  test('iterated.taking is lazy', () => {
    let inc = 0;
    expect(
      iterated<number>(_ => inc++)
        .taking(5)
        .apply(toArray)(42),
    ).toEqual([42, 0, 1, 2, 3]);
    expect(inc).toBe(4);
  });

  test('indexing worded', () => {
    expect(
      IEach.OrdMap<number>()<string>().compose(worded).apply(headOption)(
        OrdMap([42, 'test test']),
      ),
    ).toEqual(Some('test'));

    expect(
      IEach.OrdMap<number>()<string>().icomposeL(worded).apply(iheadOption)(
        OrdMap([42, 'test test']),
      ),
    ).toEqual(Some(['test', 42]));
  });

  test('indexing lines', () => {
    expect(
      IEach.OrdMap<number>()<string>().compose(lined).apply(headOption)(
        OrdMap([42, 'test\r\ntest']),
      ),
    ).toEqual(Some('test'));

    expect(
      IEach.OrdMap<number>()<string>().icomposeL(lined).apply(iheadOption)(
        OrdMap([42, 'test\ntest']),
      ),
    ).toEqual(Some(['test', 42]));
  });

  test('indexing supports laziness', () => {
    let inc = 0;
    expect(
      iterated<number>(_ => inc++)
        .indexing()
        .taking(10)
        .apply(toArray)(42),
    ).toEqual([42, 0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(inc).toBe(9);
  });

  test('taking is stack safe', () => {
    const size = 50_000;
    expect(
      iterated<number>(x => x + 1)
        .taking(size)
        .apply(toArray)(0),
    ).toEqual([...new Array(size).keys()]);
  });

  test('dropping works on infinite optics', () => {
    expect(
      iterated<number>(x => x + 1)
        .dropping(10)
        .apply(toLazyList)(0)
        .take(10).toArray,
    ).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });

  test('dropping is stack safe', () => {
    const size = 50_000;
    expect(
      iterated<number>(x => x + 1)
        .dropping(size)
        .apply(toLazyList)(0)
        .take(size).toArray,
    ).toEqual([...new Array(size * 2).keys()].slice(size));
  });

  test('orElse returns first traversal is its not empty', () => {
    expect(
      each<number>()
        .orElse(each<number>().compose(to(x => -x)))
        .apply(toArray)([1, 2, 3, 4]),
    ).toEqual([1, 2, 3, 4]);
  });

  test('orElse returns second traversal is its empty', () => {
    expect(
      each<number>()
        .taking(0)
        .orElse(each<number>().compose(to(x => -x)))
        .apply(toArray)([1, 2, 3, 4]),
    ).toEqual([-1, -2, -3, -4]);
  });

  test('nested indexing', () => {
    expect(
      IEach.OrdMap<number>()<OrdMap<string, string>>()
        .icompose(IEach.OrdMap<string>()())
        .compose(worded)
        .apply(iheadOption)(OrdMap([42, OrdMap(['testing', 'test test'])])),
    ).toEqual(Some(['test', [42, 'testing']]));
  });

  describe('Laws', () => {
    checkAll(
      'Traversal<List<number>, number>',
      TraversalSuite(eachLi).traversal(
        CA.fp4tsList(fc.integer()),
        fc.integer(),
        List.Eq(Eq.fromUniversalEquals()),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Traversal<Location, { longitude: number, latitude: number  }>',
      TraversalSuite(coordinates).traversal(
        locationArb,
        fc.record({ latitude: fc.integer(), longitude: fc.integer() }),
        locationEq,
        Eq.struct({
          latitude: Eq.fromUniversalEquals(),
          longitude: Eq.fromUniversalEquals(),
        }),
      ),
    );

    checkAll(
      'Traversal<Each<[number, number]>, number>',
      TraversalSuite(Each.Tuple<[number, number]>()).traversal(
        fc.tuple(fc.integer(), fc.integer()),
        fc.integer(),
        Eq.tuple(Eq.fromUniversalEquals(), Eq.fromUniversalEquals()),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Traversal<Each<[number, number, number]>, number>',
      TraversalSuite(Each.Tuple<[number, number, number]>()).traversal(
        fc.tuple(fc.integer(), fc.integer(), fc.integer()),
        fc.integer(),
        Eq.tuple(
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
        ),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Traversal<Each<number[]>, number>',
      TraversalSuite(Each.Array<number>()).traversal(
        fc.array(fc.integer()),
        fc.integer(),
        Eq.Array(Eq.fromUniversalEquals()),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Traversal<Each<List<number>>, number>',
      TraversalSuite(Each.List<number>()).traversal(
        CA.fp4tsList(fc.integer()),
        fc.integer(),
        List.Eq(Eq.fromUniversalEquals()),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Traversal<Each<LazyList<number>>, number>',
      TraversalSuite(Each.LazyList<number>()).traversal(
        CA.fp4tsLazyList(fc.integer()),
        fc.integer(),
        LazyList.EqK.liftEq(Eq.fromUniversalEquals()),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Traversal<Each<Seq<number>>, number>',
      TraversalSuite(Each.Seq<number>()).traversal(
        CA.fp4tsSeq(fc.integer()),
        fc.integer(),
        Seq.Eq(Eq.fromUniversalEquals()),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Traversal<Each<Vector<number>>, number>',
      TraversalSuite(Each.Vector<number>()).traversal(
        CA.fp4tsVector(fc.integer()),
        fc.integer(),
        Vector.Eq(Eq.fromUniversalEquals()),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Traversal<Each<Map<string, number>>, number>',
      TraversalSuite(Each.Map<string>()<number>()).traversal(
        CA.fp4tsOrdMap(fc.string(), fc.integer()),
        fc.integer(),
        OrdMap.Eq(Eq.fromUniversalEquals(), Eq.fromUniversalEquals()),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Traversal<Each<Option<number>>, number>',
      TraversalSuite(Each.Option<number>()).traversal(
        A.fp4tsOption(fc.integer()),
        fc.integer(),
        Option.Eq(Eq.fromUniversalEquals()),
        Eq.fromUniversalEquals(),
      ),
    );
    checkAll(
      'Traversal<Each<Either<string, number>>, number>',
      TraversalSuite(Each.Either<string>()<number>()).traversal(
        A.fp4tsEither(fc.string(), fc.integer()),
        fc.integer(),
        Either.Eq(Eq.fromUniversalEquals(), Eq.fromUniversalEquals()),
        Eq.fromUniversalEquals(),
      ),
    );
  });
});
