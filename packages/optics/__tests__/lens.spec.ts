// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eq, Monoid, None, Some } from '@fp4ts/cats';
import { List } from '@fp4ts/collections';
import {
  all,
  any,
  find,
  foldMap,
  get,
  iso,
  modify,
  replace,
  to,
} from '@fp4ts/optics-core';
import {
  prop,
  toList,
  _1,
  _2,
  _3,
  _4,
  _5,
  _6,
  _7,
  _8,
} from '@fp4ts/optics-std';
import { deriveLenses } from '@fp4ts/optics-derivation';
import { LensSuite } from '@fp4ts/optics-laws';
import { Schema, Schemable, TypeOf } from '@fp4ts/schema';
import { ArbitraryInstances } from '@fp4ts/schema-test-kit';
import { checkAll } from '@fp4ts/cats-test-kit';

describe('Lens', () => {
  const _Point = Schema.struct({ x: Schema.number, y: Schema.number });
  type Point = TypeOf<typeof _Point>;
  const Point = (x: number, y: number): Point => ({ x, y });

  const _Example = Schema.struct({ s: Schema.string, p: _Point });
  type Example = TypeOf<typeof _Example>;
  const Example = (s: string, p: Point): Example => ({ s, p });
  const arbExample = _Example.interpret(ArbitraryInstances.Schemable);
  const eqExample = _Example.interpret(Schemable.Eq);

  const s = iso<Example>().compose(prop('s'));
  const p = iso<Example>().compose(prop('p'));

  const x = deriveLenses(_Point).x;
  const y = deriveLenses(_Point).y;

  it('should compose', () => {
    expect(p.compose(x).apply(get)(Example('', Point(2, 3)))).toBe(2);
    expect(p.compose(y).apply(get)(Example('', Point(2, 3)))).toBe(3);

    expect(p.compose(x).apply(replace)(42)(Example('', Point(2, 3)))).toEqual(
      Example('', Point(42, 3)),
    );
    expect(p.compose(y).apply(replace)(42)(Example('', Point(2, 3)))).toEqual(
      Example('', Point(2, 42)),
    );
  });

  it('should compose with subclasses', () => {
    expect(p.compose(x).apply(get)(Example('', Point(2, 3)))).toEqual(2);
    // expect(p.compose(x).getOptional(Example('', Point(2, 3)))).toEqual(Some(2));
    expect(p.compose(x).apply(toList)(Example('', Point(2, 3)))).toEqual(
      List(2),
    );
    expect(
      p.compose(x).apply(foldMap)(Monoid.addition)(x => x)(
        Example('', Point(2, 3)),
      ),
    ).toEqual(2);
    expect(p.compose(x).apply(replace)(42)(Example('', Point(2, 3)))).toEqual(
      Example('', Point(42, 3)),
    );
  });

  test('get', () => {
    expect(x.apply(get)(Point(2, 3))).toBe(2);
    expect(y.apply(get)(Point(2, 3))).toBe(3);
  });

  test('find', () => {
    expect(x.apply(find)(x => x % 2 === 0)(Point(2, 3))).toEqual(Some(2));
    expect(y.apply(find)(x => x % 2 === 0)(Point(2, 3))).toEqual(None);
  });

  test('any', () => {
    expect(x.apply(any)(x => x % 2 === 0)(Point(2, 3))).toBe(true);
    expect(x.apply(any)(x => x % 2 !== 0)(Point(2, 3))).toBe(false);
    expect(y.apply(any)(x => x % 2 === 0)(Point(2, 3))).toBe(false);
    expect(y.apply(any)(x => x % 2 !== 0)(Point(2, 3))).toBe(true);
  });

  test('all', () => {
    expect(x.apply(all)(x => x % 2 === 0)(Point(2, 3))).toBe(true);
    expect(x.apply(all)(x => x % 2 !== 0)(Point(2, 3))).toBe(false);
    expect(y.apply(all)(x => x % 2 === 0)(Point(2, 3))).toBe(false);
    expect(y.apply(all)(x => x % 2 !== 0)(Point(2, 3))).toBe(true);
  });

  test('modify', () => {
    expect(x.apply(modify)(x => x + 1)(Point(2, 3))).toEqual(Point(3, 3));
    expect(y.apply(modify)(x => x + 1)(Point(2, 3))).toEqual(Point(2, 4));
  });

  test('to', () => {
    expect(x.compose(to(x => `${x}`)).apply(get)(Point(2, 3))).toBe('2');
    expect(y.compose(to(x => `${x}`)).apply(get)(Point(2, 3))).toBe('3');
  });

  // test('filter', () => {
  //   expect(x.filter(x => x % 2 === 0).getOptional(Point(2, 3))).toEqual(
  //     Some(2),
  //   );
  //   expect(y.filter(x => x % 2 === 0).getOptional(Point(2, 3))).toEqual(None);
  // });

  // test('at', () => {
  //   const map = Map([1, 'one']);
  //   const mapLens = Iso.id<Map<number, string>>().asLens();
  //   const at = At.Map<number, string>(Ord.fromUniversalCompare());

  //   expect(mapLens.at(1, at).get(map)).toEqual(Some('one'));
  //   expect(mapLens.at(0, at).get(map)).toEqual(None);
  //   expect(mapLens.at(1, at).replace(Some('two'))(map)).toEqual(
  //     Map([1, 'two']),
  //   );
  //   expect(mapLens.at(0, at).replace(Some('two'))(map)).toEqual(
  //     Map([0, 'two'], [1, 'one']),
  //   );
  //   expect(mapLens.at(1, at).replace(None)(map)).toEqual(Map.empty);
  // });

  describe('Laws', () => {
    checkAll(
      'Lens<Example, string>',
      LensSuite(s).lens(
        arbExample,
        fc.string(),
        eqExample,
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Lens<Example, Point> . Lens<Point, number>',
      LensSuite(p.compose(x)).lens(
        arbExample,
        fc.integer(),
        eqExample,
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Lens<[number], number>',
      LensSuite(_1<[number]>()).lens(
        fc.tuple(fc.integer()),
        fc.integer(),
        Eq.tuple(Eq.fromUniversalEquals()),
        Eq.fromUniversalEquals(),
      ),
    );

    const arbVoid = fc.constant(undefined) as Arbitrary<void>;

    checkAll(
      'Lens<_1<[number, string, void]>, number>',
      LensSuite(_1<[number, string, void]>()).lens(
        fc.tuple(fc.integer(), fc.string(), arbVoid),
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
      'Lens<_2<[number, string, void]>, string>',
      LensSuite(_2<[number, string, void]>()).lens(
        fc.tuple(fc.integer(), fc.string(), arbVoid),
        fc.string(),
        Eq.tuple(
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
        ),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Lens<_3<[number, string, boolean]>, boolean>',
      LensSuite(_3<[number, string, boolean]>()).lens(
        fc.tuple(fc.integer(), fc.string(), fc.boolean()),
        fc.boolean(),
        Eq.tuple(
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
        ),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Lens<_4<[void, void, void, number]>, number>',
      LensSuite(_4<[void, void, void, number]>()).lens(
        fc.tuple(arbVoid, arbVoid, arbVoid, fc.integer()),
        fc.integer(),
        Eq.tuple(
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
        ),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Lens<_5<[void, void, void, void, number]>, number>',
      LensSuite(_5<[void, void, void, void, number]>()).lens(
        fc.tuple(arbVoid, arbVoid, arbVoid, arbVoid, fc.integer()),
        fc.integer(),
        Eq.tuple(
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
        ),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Lens<_6<[void, void, void, void, void, number]>, number>',
      LensSuite(_6<[void, void, void, void, void, number]>()).lens(
        fc.tuple(arbVoid, arbVoid, arbVoid, arbVoid, arbVoid, fc.integer()),
        fc.integer(),
        Eq.tuple(
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
        ),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Lens<_7<[void, void, void, void, void, number]>, number>',
      LensSuite(_7<[void, void, void, void, void, void, number]>()).lens(
        fc.tuple(
          arbVoid,
          arbVoid,
          arbVoid,
          arbVoid,
          arbVoid,
          arbVoid,
          fc.integer(),
        ),
        fc.integer(),
        Eq.tuple(
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
        ),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Lens<_8<[void, void, void, void, void, void, number]>, number>',
      LensSuite(_8<[void, void, void, void, void, void, void, number]>()).lens(
        fc.tuple(
          arbVoid,
          arbVoid,
          arbVoid,
          arbVoid,
          arbVoid,
          arbVoid,
          arbVoid,
          fc.integer(),
        ),
        fc.integer(),
        Eq.tuple(
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
        ),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Lens<_2<[number, [number, boolean], string]> . _2<[number, boolean]>, boolean>',
      LensSuite(_2<[number, [number, boolean], string]>().compose(_2())).lens(
        fc.tuple(
          fc.integer(),
          fc.tuple(fc.integer(), fc.boolean()),
          fc.string(),
        ),
        fc.boolean(),
        Eq.tuple(
          Eq.fromUniversalEquals(),
          Eq.tuple(Eq.fromUniversalEquals(), Eq.fromUniversalEquals()),
          Eq.fromUniversalEquals(),
        ),
        Eq.fromUniversalEquals(),
      ),
    );
  });
});
