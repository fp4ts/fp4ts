// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List, Monoid, None, Some } from '@fp4ts/cats';
import { Reader, State } from '@fp4ts/mtl';
import {
  all,
  any,
  find,
  folded,
  foldMap,
  get,
  to,
  use,
  view,
} from '@fp4ts/optics-core';

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
  const bazFold = folded(List.Foldable)<number>();

  it('should compose', () => {
    expect(bar.compose(i).apply(get)(new Foo(new Bar(42)))).toBe(42);
    expect(
      is.compose(bazFold).apply(foldMap)(Monoid.string)(x => `${x}`)(
        new Baz(List(1, 2, 3, 4, 5)),
      ),
    ).toEqual('12345');
  });

  test('get', () => {
    expect(bar.apply(get)(new Foo(new Bar(42)))).toEqual(new Bar(42));
    expect(bar.compose(i).apply(get)(new Foo(new Bar(42)))).toEqual(42);
  });

  test('find', () => {
    expect(i.apply(find)(x => x > 9)(new Bar(42))).toEqual(Some(42));
    expect(i.apply(find)(x => x > 9)(new Bar(-1))).toEqual(None);
  });

  test('any', () => {
    expect(i.apply(any)(x => x > 9)(new Bar(42))).toBe(true);
    expect(i.apply(any)(x => x > 9)(new Bar(-1))).toBe(false);
  });

  test('all', () => {
    expect(i.apply(all)(x => x > 9)(new Bar(42))).toBe(true);
    expect(i.apply(all)(x => x > 9)(new Bar(-1))).toBe(false);
  });

  test('view', () => {
    expect(
      i.apply(view(Reader.MonadReader<Bar>())).runReader(new Bar(42)),
    ).toBe(42);
    expect(
      bar
        .compose(i)
        .apply(view(Reader.MonadReader<Foo>()))
        .runReader(new Foo(new Bar(42))),
    ).toBe(42);
  });

  test('use', () => {
    expect(i.apply(use(State.MonadState<Bar>())).runA(null, new Bar(42))).toBe(
      42,
    );
    expect(
      bar
        .compose(i)
        .apply(use(State.MonadState<Foo>()))
        .runA(null, new Foo(new Bar(42))),
    ).toBe(42);
  });
});
