// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Left, List, Map, Monoid, None, Ord, Right, Some } from '@fp4ts/cats';
import { At, Fold, Getter, Iso } from '@fp4ts/optics-core';

describe('Getter', () => {
  class Foo {
    public constructor(public readonly bar: Bar) {}
  }
  class Bar {
    public constructor(public readonly i: number) {}
  }
  class Baz {
    public constructor(public readonly is: List<number>) {}
  }

  const bar = new Getter<Foo, Bar>(foo => foo.bar);
  const i = new Getter<Bar, number>(bar => bar.i);
  const is = new Getter<Baz, List<number>>(baz => baz.is);
  const bazFold = Fold.fromFoldable(List.Foldable)<number>();

  it('should compose', () => {
    expect(bar.andThen(i).get(new Foo(new Bar(42)))).toBe(42);
    expect(
      is.andThen(bazFold).foldMap(Monoid.string)(x => `${x}`)(
        new Baz(List(1, 2, 3, 4, 5)),
      ),
    ).toEqual('12345');
  });

  test('get', () => {
    expect(bar.get(new Foo(new Bar(42)))).toEqual(new Bar(42));
    expect(bar.andThen(i).get(new Foo(new Bar(42)))).toEqual(42);
  });

  test('find', () => {
    expect(i.find(x => x > 9)(new Bar(42))).toEqual(Some(42));
    expect(i.find(x => x > 9)(new Bar(-1))).toEqual(None);
  });

  test('any', () => {
    expect(i.any(x => x > 9)(new Bar(42))).toBe(true);
    expect(i.any(x => x > 9)(new Bar(-1))).toBe(false);
  });

  test('all', () => {
    expect(i.all(x => x > 9)(new Bar(42))).toBe(true);
    expect(i.all(x => x > 9)(new Bar(-1))).toBe(false);
  });

  test('choice', () => {
    const x = i.choice(bar.andThen(i));

    expect(x.get(Left(new Bar(42)))).toBe(42);
    expect(x.get(Right(new Foo(new Bar(43))))).toBe(43);
  });

  test('split', () => {
    const x = i.split(bar);

    expect(x.get([new Bar(42), new Foo(new Bar(43))])).toEqual([
      42,
      new Bar(43),
    ]);
  });

  test('zip', () => {
    const len = new Getter((s: string) => s.length);
    const upper = new Getter((s: string) => s.toUpperCase());

    expect(len.zip(upper).get('hello world')).toEqual([11, 'HELLO WORLD']);
  });

  test('at', () => {
    const map = Map([1, 'one']);
    const mapFold = Iso.id<Map<number, string>>().asGetter();
    const at = At.Map<number, string>(Ord.primitive);

    expect(mapFold.at(1, at).get(map)).toEqual(Some('one'));
    expect(mapFold.at(0, at).get(map)).toEqual(None);
  });
});
