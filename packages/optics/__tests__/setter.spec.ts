// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, List } from '@fp4ts/cats';
import { Reader, State } from '@fp4ts/cats-mtl';
import { focus, fromFunctor, Setter } from '@fp4ts/optics-core';
import { SetterSuite } from '@fp4ts/optics-laws';
import { checkAll, forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Setter', () => {
  const eachL = <A>(): Setter<List<A>, A> => fromFunctor(List.Functor)<A, A>();

  const eachLi: Setter<List<number>, number> = eachL<number>();

  it('should compose', () => {
    expect(
      focus(eachL<List<number>>()).andThen(eachLi).replace(3)(
        List(List(1, 2, 3), List(3)),
      ),
    ).toEqual(List(List(3, 3, 3), List(3)));
  });

  test(
    'replace',
    forAll(A.fp4tsList(fc.integer()), xs =>
      focus(eachLi)
        .replace(0)(xs)
        .equals(
          Eq.primitive,
          xs.map(() => 0),
        ),
    ),
  );

  test(
    'modify',
    forAll(A.fp4tsList(fc.integer()), xs =>
      focus(eachLi)
        .modify(x => x + 1)(xs)
        .equals(
          Eq.primitive,
          xs.map(x => x + 1),
        ),
    ),
  );

  test(
    'filter',
    forAll(A.fp4tsList(fc.integer()), xs =>
      focus(eachLi)
        .filter(x => x % 2 === 0)
        .replace(0)(xs)
        .equals(
          Eq.primitive,
          xs.map(x => (x % 2 === 0 ? 0 : x)),
        ),
    ),
  );

  test(
    'plus',
    forAll(A.fp4tsList(fc.integer()), fc.integer(), (xs, n) =>
      focus(eachLi)
        .add(n)(xs)
        .equals(
          Eq.primitive,
          xs.map(x => x + n),
        ),
    ),
  );

  test(
    'sub',
    forAll(A.fp4tsList(fc.integer()), fc.integer(), (xs, n) =>
      focus(eachLi)
        .sub(n)(xs)
        .equals(
          Eq.primitive,
          xs.map(x => x - n),
        ),
    ),
  );

  test(
    'mul',
    forAll(A.fp4tsList(fc.integer()), fc.integer(), (xs, n) =>
      focus(eachLi)
        .mul(n)(xs)
        .equals(
          Eq.primitive,
          xs.map(x => x * n),
        ),
    ),
  );

  test(
    'div',
    forAll(A.fp4tsList(fc.integer()), fc.integer(), (xs, n) =>
      focus(eachLi)
        .div(n)(xs)
        .equals(
          Eq.primitive,
          xs.map(x => x / n),
        ),
    ),
  );

  test(
    'and',
    forAll(A.fp4tsList(fc.boolean()), fc.boolean(), (xs, n) =>
      focus(eachL<boolean>())
        .and(n)(xs)
        .equals(
          Eq.primitive,
          xs.map(x => x && n),
        ),
    ),
  );

  test(
    'or',
    forAll(A.fp4tsList(fc.boolean()), fc.boolean(), (xs, n) =>
      focus(eachL<boolean>())
        .or(n)(xs)
        .equals(
          Eq.primitive,
          xs.map(x => x || n),
        ),
    ),
  );

  test(
    'concat',
    forAll(
      A.fp4tsList(A.fp4tsList(fc.integer())),
      A.fp4tsList(fc.integer()),
      (xxs, xs) =>
        focus(eachL<List<number>>())
          .concat(List.SemigroupK.algebra())(xs)(xxs)
          .equals(
            List.Eq(Eq.primitive),
            xxs.map(x => x['+++'](xs)),
          ),
    ),
  );

  const i = focus<number>();
  const b = focus<boolean>();
  const SI = State.MonadState<number>();
  const SB = State.MonadState<boolean>();

  test(
    'assign',
    forAll(fc.integer(), fc.integer(), (x, y) =>
      expect(i.assign(SI)(x).runState(y)).toEqual(
        State.state(() => [x, undefined]).runState(y),
      ),
    ),
  );

  test(
    'modifying',
    forAll(fc.func<[number], number>(fc.integer()), fc.integer(), (f, y) =>
      expect(i.modifying(SI)(f).runState(y)).toEqual(
        State.state((s: number) => [f(s), undefined]).runState(y),
      ),
    ),
  );

  test(
    'adding',
    forAll(fc.integer(), fc.integer(), (x, y) =>
      expect(i.adding(SI)(x).runState(y)).toEqual(
        State.state((s: number) => [s + x, undefined]).runState(y),
      ),
    ),
  );
  test(
    'subtracting',
    forAll(fc.integer(), fc.integer(), (x, y) =>
      expect(i.subtracting(SI)(x).runState(y)).toEqual(
        State.state((s: number) => [s - x, undefined]).runState(y),
      ),
    ),
  );

  test(
    'multiplying',
    forAll(fc.integer(), fc.integer(), (x, y) =>
      expect(i.multiplying(SI)(x).runState(y)).toEqual(
        State.state((s: number) => [s * x, undefined]).runState(y),
      ),
    ),
  );

  test(
    'dividing',
    forAll(fc.integer(), fc.integer(), (x, y) =>
      expect(i.dividing(SI)(x).runState(y)).toEqual(
        State.state((s: number) => [s / x, undefined]).runState(y),
      ),
    ),
  );

  test(
    'anding',
    forAll(fc.boolean(), fc.boolean(), (x, y) =>
      expect(b.anding(SB)(x).runState(y)).toEqual(
        State.state((s: boolean) => [s && x, undefined]).runState(y),
      ),
    ),
  );

  test(
    'oring',
    forAll(fc.boolean(), fc.boolean(), (x, y) =>
      expect(b.oring(SB)(x).runState(y)).toEqual(
        State.state((s: boolean) => [s || x, undefined]).runState(y),
      ),
    ),
  );

  test(
    'concatenating',
    forAll(A.fp4tsList(fc.integer()), A.fp4tsList(fc.integer()), (x, y) =>
      expect(
        focus<List<number>>()
          .concatenating(
            State.MonadState(),
            List.MonoidK.algebra(),
          )(x)
          .runState(y),
      ).toEqual(
        State.state((s: List<number>) => [s['+++'](x), undefined]).runState(y),
      ),
    ),
  );

  test(
    'locally',
    forAll(fc.integer(), fc.func<[number], number>(fc.integer()), (x, f) =>
      expect(
        focus<number>()
          .locally(Reader.MonadReader<number>())(f)(Reader.ask())
          .runReader(x),
      ).toEqual(Reader.ask<number>().map(f).runReader(x)),
    ),
  );

  // test('at', () => {
  //   const map = Map([1, 'one']);
  //   const mapSetter = Iso.id<Map<number, string>>();
  //   const at = At.Map<number, string>(Ord.primitive);

  //   expect(mapSetter.at(1, at).replace(Some('two'))(map)).toEqual(
  //     Map([1, 'two']),
  //   );
  //   expect(mapSetter.at(0, at).replace(Some('two'))(map)).toEqual(
  //     Map([1, 'one'], [0, 'two']),
  //   );
  //   expect(mapSetter.at(1, at).replace(None)(map)).toEqual(Map.empty);
  // });

  describe('Laws', () => {
    const setterTests = SetterSuite(eachLi);
    checkAll(
      'Setter<List<number>, number>',
      setterTests.setter(
        A.fp4tsList(fc.integer()),
        fc.integer(),
        List.Eq(Eq.primitive),
        Eq.primitive,
      ),
    );
  });
});
