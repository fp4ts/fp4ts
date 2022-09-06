// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List, Monoid, None, Some } from '@fp4ts/cats';
import { Reader, State } from '@fp4ts/cats-mtl';
import { to, fromFoldable, focus } from '@fp4ts/optics-core';

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

  const bar = to<Foo, Bar>(foo => foo.bar);
  const i = to<Bar, number>(bar => bar.i);
  const is = to<Baz, List<number>>(baz => baz.is);
  const bazFold = fromFoldable(List.Foldable)((xs: List<number>) => xs);

  it('should compose', () => {
    expect(
      focus(bar)
        .compose(i)
        .get(new Foo(new Bar(42))),
    ).toBe(42);
    expect(
      focus(is)
        .compose(bazFold)
        .asGetting(Monoid.string)
        .foldMap(x => `${x}`)(new Baz(List(1, 2, 3, 4, 5))),
    ).toEqual('12345');
  });

  test('get', () => {
    expect(focus(bar).get(new Foo(new Bar(42)))).toEqual(new Bar(42));
    expect(
      focus(bar)
        .compose(i)
        .get(new Foo(new Bar(42))),
    ).toEqual(42);
  });

  test('find', () => {
    expect(focus(i).find(x => x > 9)(new Bar(42))).toEqual(Some(42));
    expect(focus(i).find(x => x > 9)(new Bar(-1))).toEqual(None);
  });

  test('any', () => {
    expect(focus(i).any(x => x > 9)(new Bar(42))).toBe(true);
    expect(focus(i).any(x => x > 9)(new Bar(-1))).toBe(false);
  });

  test('all', () => {
    expect(focus(i).all(x => x > 9)(new Bar(42))).toBe(true);
    expect(focus(i).all(x => x > 9)(new Bar(-1))).toBe(false);
  });

  test('view', () => {
    expect(
      focus(i).asGetting().view(Reader.MonadReader<Bar>()).runA(new Bar(42)),
    ).toBe(42);
    expect(
      focus(bar)
        .compose(i)
        .asGetting()
        .view(Reader.MonadReader<Foo>())
        .runA(new Foo(new Bar(42))),
    ).toBe(42);
  });

  test('use', () => {
    expect(
      focus(i).asGetting().use(State.MonadState<Bar>()).runA(null, new Bar(42)),
    ).toBe(42);
    expect(
      focus(bar)
        .compose(i)
        .asGetting()
        .use(State.MonadState<Foo>())
        .runA(null, new Foo(new Bar(42))),
    ).toBe(42);
  });

  // test('choice', () => {
  //   const x = i.choice(bar.compose(i));

  //   expect(x.get(Left(new Bar(42)))).toBe(42);
  //   expect(x.get(Right(new Foo(new Bar(43))))).toBe(43);
  // });

  // test('split', () => {
  //   const x = i.split(bar);

  //   expect(x.get([new Bar(42), new Foo(new Bar(43))])).toEqual([
  //     42,
  //     new Bar(43),
  //   ]);
  // });

  // test('zip', () => {
  //   const len = new Getter((s: string) => s.length);
  //   const upper = new Getter((s: string) => s.toUpperCase());

  //   expect(len.zip(upper).get('hello world')).toEqual([11, 'HELLO WORLD']);
  // });

  // test('at', () => {
  //   const map = Map([1, 'one']);
  //   const mapFold = Iso.id<Map<number, string>>().asGetter();
  //   const at = At.Map<number, string>(Ord.primitive);

  //   expect(mapFold.at(1, at).get(map)).toEqual(Some('one'));
  //   expect(mapFold.at(0, at).get(map)).toEqual(None);
  // });
});
