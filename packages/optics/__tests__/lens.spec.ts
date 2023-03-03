// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, List, Monoid, None, Some } from '@fp4ts/cats';
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
import { prop, toList } from '@fp4ts/optics-std';
import { deriveLenses } from '@fp4ts/optics-derivation';
import { LensSuite, SetterSuite, TraversalSuite } from '@fp4ts/optics-laws';
import { Schema, Schemable, TypeOf } from '@fp4ts/schema';
import { ArbitraryInstances } from '@fp4ts/schema-test-kit';
import { checkAll } from '@fp4ts/cats-test-kit';

describe('Lens', () => {
  const _Point = Schema.struct({ x: Schema.number, y: Schema.number });
  type Point = TypeOf<typeof _Point>;
  const Point = (x: number, y: number): Point => ({ x, y });
  const arbPoint = _Point.interpret(ArbitraryInstances.Schemable);
  const eqPoint = _Point.interpret(Schemable.Eq);

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
      'lens.asTraversal',
      TraversalSuite(s).traversal(
        arbExample,
        fc.string(),
        eqExample,
        Eq.fromUniversalEquals(),
      ),
    );
    checkAll(
      'lens.asSetter',
      SetterSuite(s).setter(
        arbExample,
        fc.string(),
        eqExample,
        Eq.fromUniversalEquals(),
      ),
    );
  });
});
