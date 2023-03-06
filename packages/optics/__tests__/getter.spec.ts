// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Monoid, None, Some } from '@fp4ts/cats';
import { List } from '@fp4ts/collections';
import { forAll } from '@fp4ts/cats-test-kit';
import { Reader, State } from '@fp4ts/mtl';
import {
  all,
  any,
  Each,
  each,
  find,
  folded,
  foldMap,
  get,
  headOption,
  ieach,
  iget,
  iheadOption,
  ipre,
  iso,
  ito,
  pre,
  to,
  use,
  uses,
  view,
  views,
} from '@fp4ts/optics-core';
import { toMap } from '@fp4ts/optics-std';
import fc from 'fast-check';

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

  test(
    'ito',
    forAll(
      fc
        .array(fc.tuple(fc.string(), fc.integer()))
        .map(xs => List.fromArray(xs).distinctBy(([k1], [k2]) => k1 === k2)),
      xs =>
        expect(
          Each.List<[string, number]>()
            .icomposeR(ito(([k, i]) => [i, k]))
            .apply(toMap())(xs).toArray,
        ).toEqual(xs.toMap().toArray),
    ),
  );

  test(
    'pre . get is headOption',
    forAll(fc.array(fc.integer()), xs =>
      expect(each<number>().apply(pre).apply(get)(xs)).toEqual(
        each<number>().apply(headOption)(xs),
      ),
    ),
  );

  test(
    'ipre . get is iheadOption',
    forAll(fc.array(fc.integer()), xs =>
      expect(ieach<number>().apply(ipre).apply(get)(xs)).toEqual(
        ieach<number>().apply(iheadOption)(xs),
      ),
    ),
  );

  test('get', () => {
    expect(bar.apply(get)(new Foo(new Bar(42)))).toEqual(new Bar(42));
    expect(bar.compose(i).apply(get)(new Foo(new Bar(42)))).toEqual(42);
  });

  test('find', () => {
    expect(find(i)(x => x > 9)(new Bar(42))).toEqual(Some(42));
    expect(find(i)(x => x > 9)(new Bar(-1))).toEqual(None);
  });

  test('any', () => {
    expect(any(i)(x => x > 9)(new Bar(42))).toBe(true);
    expect(any(i)(x => x > 9)(new Bar(-1))).toBe(false);
  });

  test('all', () => {
    expect(all(i)(x => x > 9)(new Bar(42))).toBe(true);
    expect(all(i)(x => x > 9)(new Bar(-1))).toBe(false);
  });

  test('view', () => {
    expect(i.apply(view(Reader.MonadReader())).runReader(new Bar(42))).toBe(42);
    expect(
      bar
        .compose(i)
        .apply(view(Reader.MonadReader()))
        .runReader(new Foo(new Bar(42))),
    ).toBe(42);
  });

  test('views', () => {
    expect(
      i.apply(views(Reader.MonadReader()))(String).runReader(new Bar(42)),
    ).toBe('42');
    expect(
      bar
        .compose(i)
        .apply(views(Reader.MonadReader()))(String)
        .runReader(new Foo(new Bar(42))),
    ).toBe('42');
  });

  test('use', () => {
    expect(i.apply(use(State.MonadState())).runA(null, new Bar(42))).toBe(42);
    expect(
      bar
        .compose(i)
        .apply(use(State.MonadState()))
        .runA(null, new Foo(new Bar(42))),
    ).toBe(42);
  });

  test('uses', () => {
    expect(
      i.apply(uses(State.MonadState()))(String).runA(null, new Bar(42)),
    ).toBe('42');
    expect(
      bar
        .compose(i)
        .apply(uses(State.MonadState()))(String)
        .runA(null, new Foo(new Bar(42))),
    ).toBe('42');
  });
});
