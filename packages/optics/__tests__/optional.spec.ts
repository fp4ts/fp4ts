// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, List, Monoid, Option, Some } from '@fp4ts/cats';
import { focus, Optional, Optional_ } from '@fp4ts/optics-core';
import { OptionalSuite, SetterSuite, TraversalSuite } from '@fp4ts/optics-laws';
import { checkAll, forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Optional', () => {
  const headOptional = <A>(): Optional<List<A>, A> =>
    Optional_(
      xs => xs.headOption,
      a => xs =>
        xs.fold(
          () => List.empty,
          (_, tl) => tl.cons(a),
        ),
    );

  const headOptionalI = headOptional<number>();

  it('should compose', () => {
    expect(
      focus(headOptional<List<number>>())
        .andThen(headOptionalI)
        .getOptional(List(List(1, 2, 3), List(4))),
    ).toEqual(Some(1));
  });

  test(
    'foldMap',
    forAll(
      A.fp4tsList(fc.integer()),
      xs =>
        focus(headOptionalI)
          .asGetting(Monoid.string)
          .foldMap(x => `${x}`)(xs) ===
        xs.take(1).foldMap(Monoid.string)(x => `${x}`),
    ),
  );

  test(
    'getAll',
    forAll(A.fp4tsList(fc.integer()), xs =>
      focus(headOptionalI).toList(xs).equals(Eq.primitive, xs.take(1)),
    ),
  );

  test(
    'getOption',
    forAll(A.fp4tsList(fc.integer()), xs =>
      focus(headOptionalI).getOptional(xs).equals(Eq.primitive, xs.headOption),
    ),
  );

  // test(
  //   'modifyOption',
  //   forAll(A.fp4tsList(fc.integer()), xs =>
  //     focus(headOptionalI)
  //       .modifyOption(x => x + 1)(xs)
  //       .equals(
  //         List.Eq(Eq.primitive),
  //         xs.uncons.map(([hd, tl]) => tl.cons(hd + 1)),
  //       ),
  //   ),
  // );

  test(
    'headOption',
    forAll(A.fp4tsList(fc.integer()), xs =>
      focus(headOptionalI).headOption(xs).equals(Eq.primitive, xs.headOption),
    ),
  );

  test(
    'lastOption',
    forAll(A.fp4tsList(fc.integer()), xs =>
      focus(headOptionalI).lastOption(xs).equals(Eq.primitive, xs.headOption),
    ),
  );

  test(
    'size',
    forAll(
      A.fp4tsList(fc.integer()),
      xs => focus(headOptionalI).size(xs) === xs.take(1).size,
    ),
  );

  test(
    'isEmpty',
    forAll(
      A.fp4tsList(fc.integer()),
      xs => focus(headOptionalI).isEmpty(xs) === xs.isEmpty,
    ),
  );

  test(
    'nonEmpty',
    forAll(
      A.fp4tsList(fc.integer()),
      xs => focus(headOptionalI).nonEmpty(xs) === xs.nonEmpty,
    ),
  );

  test(
    'find',
    forAll(A.fp4tsList(fc.integer()), fc.integer(), (xs, y) =>
      focus(headOptionalI)
        .find(x => x > y)(xs)
        .equals(Eq.primitive, Option(xs.take(1).toArray.find(x => x > y))),
    ),
  );

  test(
    'any',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.integer(),
      (xs, y) =>
        focus(headOptionalI).any(x => x > y)(xs) === xs.take(1).any(x => x > y),
    ),
  );

  test(
    'all',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.integer(),
      (xs, y) =>
        focus(headOptionalI).all(x => x > y)(xs) === xs.take(1).all(x => x > y),
    ),
  );

  test(
    'to',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.func<[number], string>(fc.string()),
      (xs, f) =>
        focus(headOptionalI)
          .to(f)
          .toList(xs)
          .equals(Eq.primitive, xs.take(1).map(f)),
    ),
  );

  test(
    'replace',
    forAll(A.fp4tsList(fc.integer()), xs =>
      focus(headOptionalI)
        .replace(0)(xs)
        .equals(
          Eq.primitive,
          xs.fold(
            () => List.empty,
            (_, t) => t.cons(0),
          ),
        ),
    ),
  );

  test(
    'modify',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.func<[number], number>(fc.integer()),
      (xs, f) =>
        focus(headOptionalI)
          .modify(f)(xs)
          .equals(
            Eq.primitive,
            xs.fold(
              () => List.empty,
              (h, t) => t.cons(f(h)),
            ),
          ),
    ),
  );

  test(
    'filter',
    forAll(
      A.fp4tsList(fc.integer()),
      fc.func<[number], boolean>(fc.boolean()),
      (xs, f) =>
        focus(headOptionalI)
          .filter(f)
          .toList(xs)
          .equals(Eq.primitive, xs.take(1).filter(f)),
    ),
  );

  // test('at', () => {
  //   const map = Map([1, 'one']);
  //   const mapOptional = Iso.id<Map<number, string>>().asOptional();
  //   const at = At.Map<number, string>(Ord.primitive);

  //   expect(mapOptional.at(1, at).getAll(map)).toEqual(List(Some('one')));
  //   expect(mapOptional.at(0, at).getAll(map)).toEqual(List(None));
  //   expect(mapOptional.at(1, at).replace(Some('two'))(map)).toEqual(
  //     Map([1, 'two']),
  //   );
  //   expect(mapOptional.at(0, at).replace(Some('two'))(map)).toEqual(
  //     Map([0, 'two'], [1, 'one']),
  //   );
  //   expect(mapOptional.at(1, at).replace(None)(map)).toEqual(Map.empty);
  // });

  describe('Laws', () => {
    checkAll(
      'Optional<List<number>, number>',
      OptionalSuite(headOptionalI).optional(
        A.fp4tsList(fc.integer()),
        fc.integer(),
        List.Eq(Eq.primitive),
        Eq.primitive,
      ),
    );

    checkAll(
      'optional.asTraverse',
      TraversalSuite(headOptionalI).traversal(
        A.fp4tsList(fc.integer()),
        fc.integer(),
        List.Eq(Eq.primitive),
        Eq.primitive,
      ),
    );

    checkAll(
      'optional.asSetter',
      SetterSuite(headOptionalI).setter(
        A.fp4tsList(fc.integer()),
        fc.integer(),
        List.Eq(Eq.primitive),
        Eq.primitive,
      ),
    );
  });
});
