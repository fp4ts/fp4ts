// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, Option } from '@fp4ts/cats';
import { List } from '@fp4ts/collections';
import { Reader, State } from '@fp4ts/mtl';
import {
  add,
  and,
  div,
  each,
  filtered,
  ieach,
  imodify,
  iso,
  locally,
  mapped,
  modify,
  modifying,
  mul,
  or,
  replace,
  Setter,
  setting,
  sub,
} from '@fp4ts/optics-core';
import { SetterSuite } from '@fp4ts/optics-laws';
import { setmapped } from '@fp4ts/optics-std';
import { checkAll, forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as CA from '@fp4ts/collections-test-kit/lib/arbitraries';

describe('Setter', () => {
  const eachL = <A>(): Setter<List<A>, A> => mapped<A, A>()(List.Functor);

  const eachLi: Setter<List<number>, number> = eachL();

  it('should compose', () => {
    expect(
      eachL<List<number>>().compose(eachLi).apply(replace)(3)(
        List(List(1, 2, 3), List(3)),
      ),
    ).toEqual(List(List(3, 3, 3), List(3)));
  });

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
    forAll(CA.fp4tsList(fc.integer()), xs =>
      modify(eachLi)(x => x + 1)(xs).equals(xs.map(x => x + 1)),
    ),
  );

  test(
    'filter',
    forAll(CA.fp4tsList(fc.integer()), xs =>
      eachLi
        .compose(filtered(x => x % 2 === 0))
        .apply(replace)(0)(xs)
        .equals(xs.map(x => (x % 2 === 0 ? 0 : x))),
    ),
  );

  test(
    'plus',
    forAll(CA.fp4tsList(fc.integer()), fc.integer(), (xs, n) =>
      add(eachLi)(n)(xs).equals(xs.map(x => x + n)),
    ),
  );

  test(
    'sub',
    forAll(CA.fp4tsList(fc.integer()), fc.integer(), (xs, n) =>
      sub(eachLi)(n)(xs).equals(xs.map(x => x - n)),
    ),
  );

  test(
    'mul',
    forAll(CA.fp4tsList(fc.integer()), fc.integer(), (xs, n) =>
      mul(eachLi)(n)(xs).equals(xs.map(x => x * n)),
    ),
  );

  test(
    'div',
    forAll(CA.fp4tsList(fc.integer()), fc.integer(), (xs, n) =>
      div(eachLi)(n)(xs).equals(xs.map(x => x / n)),
    ),
  );

  test(
    'and',
    forAll(CA.fp4tsList(fc.boolean()), fc.boolean(), (xs, n) =>
      and(eachL<boolean>())(n)(xs).equals(xs.map(x => x && n)),
    ),
  );

  test(
    'or',
    forAll(CA.fp4tsList(fc.boolean()), fc.boolean(), (xs, n) =>
      or(eachL<boolean>())(n)(xs).equals(xs.map(x => x || n)),
    ),
  );

  const i = iso<number>();
  const b = iso<boolean>();
  const SI = State.MonadState<number>();
  const SB = State.MonadState<boolean>();

  test(
    'replacing',
    forAll(fc.integer(), fc.integer(), (x, y) =>
      expect(i.apply(setting(State.MonadState()))(x).runA(null, y)).toEqual(
        State.state(() => [undefined, x]).runA(null, y),
      ),
    ),
  );

  test(
    'modifying',
    forAll(fc.func<[number], number>(fc.integer()), fc.integer(), (f, y) =>
      expect(i.apply(modifying(State.MonadState()))(f).runA(null, y)).toEqual(
        State.state((s: number) => [undefined, f(s)]).runA(null, y),
      ),
    ),
  );

  test(
    'locally',
    forAll(fc.integer(), fc.func<[number], number>(fc.integer()), (x, f) =>
      expect(
        iso<number>()
          .apply(locally(Reader.MonadReader<number>()))(f)(Reader.ask())
          .provide(x)
          .run(),
      ).toEqual(Reader.ask<number>().map(f).runReader(x)),
    ),
  );

  test(
    'imodify',
    forAll(fc.array(fc.string()), xs =>
      expect(
        iso<string[]>().compose(each()).indexing().apply(imodify)((x, i) =>
          i % 2 === 0 ? 'empty' : x,
        )(xs),
      ).toEqual(xs.map((x, i) => (i % 2 === 0 ? 'empty' : x))),
    ),
  );

  test(
    'each vs eachWithIndex array equivalence',
    forAll(fc.array(fc.string()), xs =>
      expect(
        iso<string[]>().compose(each()).indexing().apply(imodify)((x, i) =>
          i % 2 === 0 ? 'empty' : x,
        )(xs),
      ).toEqual(
        iso<string[]>().icomposeR(ieach()).apply(imodify)((x, i) =>
          i % 2 === 0 ? 'empty' : x,
        )(xs),
      ),
    ),
  );

  test(
    'Set<number>',
    forAll(CA.fp4tsSet(fc.integer()), xs =>
      expect(
        setmapped<number, string>().apply(modify)(String)(xs).toArray,
      ).toEqual(xs.map(String).toArray),
    ),
  );

  describe('Laws', () => {
    checkAll(
      'Setter<List<number>, number>',
      SetterSuite(eachLi).setter(
        CA.fp4tsList(fc.integer()),
        fc.integer(),
        List.Eq(Eq.fromUniversalEquals()),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Setter<List<Option<number>>, number>',
      SetterSuite(
        mapped<Option<number>>()(List.Functor).compose(
          mapped<number>()(Option.Monad),
        ),
      ).setter(
        CA.fp4tsList(A.fp4tsOption(fc.integer())),
        fc.integer(),
        List.Eq(Option.Eq(Eq.fromUniversalEquals())),
        Eq.fromUniversalEquals(),
      ),
    );
  });
});
