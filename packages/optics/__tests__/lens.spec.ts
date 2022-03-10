// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, List, Map, Monoid, None, Ord, Some } from '@fp4ts/cats';
import { At, Iso, Lens } from '@fp4ts/optics-core';
import {
  LensSuite,
  OptionalSuite,
  SetterSuite,
  TraversalSuite,
} from '@fp4ts/optics-laws';
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

  const s = Lens.fromProp<Example>()('s');
  const p = Lens.fromProp<Example>()('p');

  const x = Lens.fromProp<Point>()('x');
  const y = Lens.fromProp<Point>()('y');
  const xy = new Lens<Point, [number, number]>(
    ({ x, y }) => [x, y],
    ([x, y]) =>
      () => ({ x, y }),
  );

  it('should compose', () => {
    expect(p.andThen(x).get(Example('', Point(2, 3)))).toBe(2);
    expect(p.andThen(y).get(Example('', Point(2, 3)))).toBe(3);

    expect(p.andThen(x).replace(42)(Example('', Point(2, 3)))).toEqual(
      Example('', Point(42, 3)),
    );
    expect(p.andThen(y).replace(42)(Example('', Point(2, 3)))).toEqual(
      Example('', Point(2, 42)),
    );
  });

  it('should compose with subclasses', () => {
    expect(p.andThen(x.asGetter()).get(Example('', Point(2, 3)))).toEqual(2);
    expect(
      p.andThen(x.asOptional()).getOption(Example('', Point(2, 3))),
    ).toEqual(Some(2));
    expect(p.andThen(x.asTraversal()).getAll(Example('', Point(2, 3)))).toEqual(
      List(2),
    );
    expect(
      p.andThen(x.asFold()).foldMap(Monoid.addition)(x => x)(
        Example('', Point(2, 3)),
      ),
    ).toEqual(2);
    expect(
      p.andThen(x.asSetter()).replace(42)(Example('', Point(2, 3))),
    ).toEqual(Example('', Point(42, 3)));
  });

  test('get', () => {
    expect(x.get(Point(2, 3))).toBe(2);
    expect(y.get(Point(2, 3))).toBe(3);
  });

  test('find', () => {
    expect(x.find(x => x % 2 === 0)(Point(2, 3))).toEqual(Some(2));
    expect(y.find(x => x % 2 === 0)(Point(2, 3))).toEqual(None);
  });

  test('any', () => {
    expect(x.any(x => x % 2 === 0)(Point(2, 3))).toBe(true);
    expect(x.any(x => x % 2 !== 0)(Point(2, 3))).toBe(false);
    expect(y.any(x => x % 2 === 0)(Point(2, 3))).toBe(false);
    expect(y.any(x => x % 2 !== 0)(Point(2, 3))).toBe(true);
  });

  test('all', () => {
    expect(x.all(x => x % 2 === 0)(Point(2, 3))).toBe(true);
    expect(x.all(x => x % 2 !== 0)(Point(2, 3))).toBe(false);
    expect(y.all(x => x % 2 === 0)(Point(2, 3))).toBe(false);
    expect(y.all(x => x % 2 !== 0)(Point(2, 3))).toBe(true);
  });

  test('modify', () => {
    expect(x.modify(x => x + 1)(Point(2, 3))).toEqual(Point(3, 3));
    expect(y.modify(x => x + 1)(Point(2, 3))).toEqual(Point(2, 4));
  });

  test('to', () => {
    expect(x.to(x => `${x}`).get(Point(2, 3))).toBe('2');
    expect(y.to(x => `${x}`).get(Point(2, 3))).toBe('3');
  });

  test('filter', () => {
    expect(x.filter(x => x % 2 === 0).getOption(Point(2, 3))).toEqual(Some(2));
    expect(y.filter(x => x % 2 === 0).getOption(Point(2, 3))).toEqual(None);
  });

  test('at', () => {
    const map = Map([1, 'one']);
    const mapLens = Iso.id<Map<number, string>>().asLens();
    const at = At.Map<number, string>(Ord.primitive);

    expect(mapLens.at(1, at).get(map)).toEqual(Some('one'));
    expect(mapLens.at(0, at).get(map)).toEqual(None);
    expect(mapLens.at(1, at).replace(Some('two'))(map)).toEqual(
      Map([1, 'two']),
    );
    expect(mapLens.at(0, at).replace(Some('two'))(map)).toEqual(
      Map([0, 'two'], [1, 'one']),
    );
    expect(mapLens.at(1, at).replace(None)(map)).toEqual(Map.empty);
  });

  describe('Laws', () => {
    checkAll(
      'Lens<Example, string>',
      LensSuite(s).lens(arbExample, fc.string(), eqExample, Eq.primitive),
    );
    checkAll(
      'Lens<Example, Point> . Lens<Point, number>',
      LensSuite(p.andThen(x)).lens(
        arbExample,
        fc.integer(),
        eqExample,
        Eq.primitive,
      ),
    );
    checkAll(
      'lens.asOptional',
      OptionalSuite(s).optional(
        arbExample,
        fc.string(),
        eqExample,
        Eq.primitive,
      ),
    );
    checkAll(
      'lens.asTraversal',
      TraversalSuite(s).traversal(
        arbExample,
        fc.string(),
        eqExample,
        Eq.primitive,
      ),
    );
    checkAll(
      'lens.asSetter',
      SetterSuite(s).setter(arbExample, fc.string(), eqExample, Eq.primitive),
    );
  });
});
