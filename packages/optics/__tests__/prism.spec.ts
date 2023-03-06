// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Either, Eq, Left, None, Option, Right, Some } from '@fp4ts/cats';
import { LazyList, List, Seq, Vector } from '@fp4ts/collections';
import { Reader, State } from '@fp4ts/mtl';
import { deriveConstructors, Schema, Schemable } from '@fp4ts/schema';
import {
  all,
  any,
  filtered,
  find,
  getOption,
  getOrModify,
  isEmpty,
  iso,
  modify,
  nonEmpty,
  prism_,
  replace,
  reuse,
  reverseGet,
  review,
  to,
  _Cons,
  _Snoc,
} from '@fp4ts/optics-core';
import {
  toList,
  _Left,
  _None,
  _NonNullable,
  _Right,
  _Some,
} from '@fp4ts/optics-std';
import { derivePrisms } from '@fp4ts/optics-derivation';
import { PrismSuite } from '@fp4ts/optics-laws';
import { ArbitraryInstances } from '@fp4ts/schema-test-kit';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as CA from '@fp4ts/collections-test-kit/lib/arbitraries';

describe('Prism', () => {
  const _IOrS = Schema.sum('tag')({
    i: Schema.struct({
      tag: Schema.literal('i' as const),
      value: Schema.number,
    }),
    s: Schema.struct({
      tag: Schema.literal('s' as const),
      value: Schema.string,
    }),
  });

  const { I, S } = deriveConstructors(_IOrS);
  const prsms = derivePrisms(_IOrS);
  const i = prsms.i.compose(
    iso<{ tag: 'i'; value: number }, number>(
      ({ value }) => value,
      value => I({ value }),
    ),
  );
  const s = prsms.s.compose(
    iso<{ tag: 's'; value: string }, string>(
      ({ value }) => value,
      value => S({ value }),
    ),
  );

  test('getOrModify', () => {
    expect(getOrModify(i)(I({ value: 42 }))).toEqual(Right(42));
    expect(getOrModify(i)(S({ value: '42' }))).toEqual(
      Left(S({ value: '42' })),
    );

    expect(getOrModify(s)(I({ value: 42 }))).toEqual(Left(I({ value: 42 })));
    expect(getOrModify(s)(S({ value: '42' }))).toEqual(Right('42'));
  });

  test('getOption', () => {
    expect(getOption(i)(I({ value: 42 }))).toEqual(Some(42));
    expect(getOption(i)(S({ value: '42' }))).toEqual(None);

    expect(getOption(s)(I({ value: 42 }))).toEqual(None);
    expect(getOption(s)(S({ value: '42' }))).toEqual(Some('42'));
  });

  test('reverseGet', () => {
    expect(reverseGet(i)(42)).toEqual(I({ value: 42 }));
    expect(reverseGet(s)('42')).toEqual(S({ value: '42' }));
  });

  test('isEmpty', () => {
    expect(isEmpty(i)(I({ value: 42 }))).toBe(false);
    expect(isEmpty(i)(S({ value: '42' }))).toBe(true);

    expect(isEmpty(s)(I({ value: 42 }))).toBe(true);
    expect(isEmpty(s)(S({ value: '42' }))).toBe(false);
  });

  test('nonEmpty', () => {
    expect(nonEmpty(i)(I({ value: 42 }))).toBe(true);
    expect(nonEmpty(i)(S({ value: '42' }))).toBe(false);

    expect(nonEmpty(s)(I({ value: 42 }))).toBe(false);
    expect(nonEmpty(s)(S({ value: '42' }))).toBe(true);
  });

  test('find', () => {
    expect(find(i)(x => x > 5)(I({ value: 42 }))).toEqual(Some(42));
    expect(find(i)(x => x > 5)(I({ value: -42 }))).toEqual(None);
    expect(find(i)(x => x > 5)(S({ value: '42' }))).toEqual(None);

    expect(find(s)(x => x.length > 2)(S({ value: 'aaa' }))).toEqual(
      Some('aaa'),
    );
    expect(find(s)(x => x.length > 2)(S({ value: 'aa' }))).toEqual(None);
    expect(find(s)(x => x.length > 3)(I({ value: 42 }))).toEqual(None);
  });

  test('all', () => {
    expect(all(i)(x => x > 5)(I({ value: 42 }))).toEqual(true);
    expect(all(i)(x => x > 5)(I({ value: -42 }))).toEqual(false);
    expect(all(i)(x => x > 5)(S({ value: '42' }))).toEqual(true);

    expect(all(s)(x => x.length > 2)(S({ value: 'aaa' }))).toEqual(true);
    expect(all(s)(x => x.length > 2)(S({ value: 'aa' }))).toEqual(false);
    expect(all(s)(x => x.length > 3)(I({ value: 42 }))).toEqual(true);
  });

  test('any', () => {
    expect(any(i)(x => x > 5)(I({ value: 42 }))).toEqual(true);
    expect(any(i)(x => x > 5)(I({ value: -42 }))).toEqual(false);
    expect(any(i)(x => x > 5)(S({ value: '42' }))).toEqual(false);

    expect(any(s)(x => x.length > 2)(S({ value: 'aaa' }))).toEqual(true);
    expect(any(s)(x => x.length > 2)(S({ value: 'aa' }))).toEqual(false);
    expect(any(s)(x => x.length > 3)(I({ value: 42 }))).toEqual(false);
  });

  test('modify', () => {
    expect(modify(i)(x => x + 1)(I({ value: 42 }))).toEqual(I({ value: 43 }));
    expect(modify(i)(x => x + 1)(S({ value: '' }))).toEqual(S({ value: '' }));

    expect(modify(s)(s => s.toUpperCase())(S({ value: 'aa' }))).toEqual(
      S({ value: 'AA' }),
    );
    expect(modify(s)(s => s.toUpperCase())(I({ value: 42 }))).toEqual(
      I({ value: 42 }),
    );
  });

  // test('modifyOption', () => {
  //   expect(i.modifyOption(x => x + 1)(I({ value: 42 }))).toEqual(
  //     Some(I({ value: 43 })),
  //   );
  //   expect(i.modifyOption(x => x + 1)(S({ value: '' }))).toEqual(None);

  //   expect(s.modifyOption(s => s.toUpperCase())(S({ value: 'aa' }))).toEqual(
  //     Some(S({ value: 'AA' })),
  //   );
  //   expect(s.modifyOption(s => s.toUpperCase())(I({ value: 42 }))).toEqual(
  //     None,
  //   );
  // });

  test('replace', () => {
    expect(replace(i)(1)(I({ value: 42 }))).toEqual(I({ value: 1 }));
    expect(replace(i)(1)(S({ value: '' }))).toEqual(S({ value: '' }));

    expect(replace(s)('')(S({ value: 'aa' }))).toEqual(S({ value: '' }));
    expect(replace(s)('')(I({ value: 42 }))).toEqual(I({ value: 42 }));
  });

  test('to', () => {
    expect(i.compose(to(x => `${x}`)).apply(toList)(I({ value: 42 }))).toEqual(
      List('42'),
    );
    expect(i.compose(to(x => `${x}`)).apply(toList)(S({ value: '' }))).toEqual(
      List.empty,
    );

    expect(
      s.compose(to(x => x.toUpperCase())).apply(toList)(S({ value: 'aa' })),
    ).toEqual(List('AA'));
    expect(
      s.compose(to(x => x.toUpperCase())).apply(toList)(I({ value: 42 })),
    ).toEqual(List.empty);
  });

  test('review', () => {
    expect(i.apply(review(Reader.MonadReader())).runReader(42)).toEqual(
      I({ value: 42 }),
    );
    expect(s.apply(review(Reader.MonadReader())).runReader('42')).toEqual(
      S({ value: '42' }),
    );
  });

  test('reuse', () => {
    expect(i.apply(reuse(State.MonadState())).runAS(null, 42)).toEqual([
      I({ value: 42 }),
      42,
    ]);
    expect(s.apply(reuse(State.MonadState())).runAS(null, '42')).toEqual([
      S({ value: '42' }),
      '42',
    ]);
  });

  describe('Laws', () => {
    const iorsArb = _IOrS.interpret(ArbitraryInstances.Schemable);
    const iorsEq = _IOrS.interpret(Schemable.Eq);

    checkAll(
      'Prism<I>',
      PrismSuite(i).prism(
        iorsArb,
        fc.integer(),
        iorsEq,
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Prism<S>',
      PrismSuite(s).prism(
        iorsArb,
        fc.string(),
        iorsEq,
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Prism<_NotNullable<string | null | undefined, string>>',
      PrismSuite(_NonNullable<string | null | undefined>()).prism(
        fc.oneof(
          fc.option(fc.string(), { nil: undefined }),
          fc.option(fc.string(), { nil: null }),
        ),
        fc.string(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Prism<_Left>',
      PrismSuite(_Left<number, string>()).prism(
        A.fp4tsEither(fc.integer(), fc.string()),
        fc.integer(),
        Either.Eq(Eq.fromUniversalEquals(), Eq.fromUniversalEquals()),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Prism<_Right>',
      PrismSuite(_Right<string, number>()).prism(
        A.fp4tsEither(fc.integer(), fc.string()),
        fc.string(),
        Either.Eq(Eq.fromUniversalEquals(), Eq.fromUniversalEquals()),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Prism<_Some>',
      PrismSuite(_Some<string>()).prism(
        A.fp4tsOption(fc.string()),
        fc.string(),
        Option.Eq(Eq.fromUniversalEquals()),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Prism<_None>',
      PrismSuite(_None()).prism(
        A.fp4tsOption(fc.string()),
        fc.constant(undefined),
        Option.Eq(Eq.fromUniversalEquals()),
        Eq.fromUniversalEquals(),
      ),
    );

    checkAll(
      'Prism<_Cons.Array>',
      PrismSuite(_Cons.Array<number>()).prism(
        fc.array(fc.integer()),
        fc.tuple(fc.integer(), fc.array(fc.integer())),
        Eq.Array(Eq.fromUniversalEquals()),
        Eq.tuple(Eq.fromUniversalEquals(), Eq.Array(Eq.fromUniversalEquals())),
      ),
    );

    checkAll(
      'Prism<_Cons.List>',
      PrismSuite(_Cons.List<number>()).prism(
        CA.fp4tsList(fc.integer()),
        fc.tuple(fc.integer(), CA.fp4tsList(fc.integer())),
        List.Eq(Eq.fromUniversalEquals()),
        Eq.tuple(Eq.fromUniversalEquals(), List.Eq(Eq.fromUniversalEquals())),
      ),
    );

    checkAll(
      'Prism<_Cons.LazyList>',
      PrismSuite(_Cons.LazyList<number>()).prism(
        CA.fp4tsLazyList(fc.integer()),
        fc.tuple(fc.integer(), CA.fp4tsLazyList(fc.integer())),
        LazyList.EqK.liftEq(Eq.fromUniversalEquals()),
        Eq.tuple(
          Eq.fromUniversalEquals(),
          LazyList.EqK.liftEq(Eq.fromUniversalEquals()),
        ),
      ),
    );

    checkAll(
      'Prism<_Cons.Seq>',
      PrismSuite(_Cons.Seq<number>()).prism(
        CA.fp4tsSeq(fc.integer()),
        fc.tuple(fc.integer(), CA.fp4tsSeq(fc.integer())),
        Seq.Eq(Eq.fromUniversalEquals()),
        Eq.tuple(Eq.fromUniversalEquals(), Seq.Eq(Eq.fromUniversalEquals())),
      ),
    );

    checkAll(
      'Prism<_Cons.Vector>',
      PrismSuite(_Cons.Vector<number>()).prism(
        CA.fp4tsVector(fc.integer()),
        fc.tuple(fc.integer(), CA.fp4tsVector(fc.integer())),
        Vector.Eq(Eq.fromUniversalEquals()),
        Eq.tuple(Eq.fromUniversalEquals(), Vector.Eq(Eq.fromUniversalEquals())),
      ),
    );

    checkAll(
      'Prism<_Snoc.Array>',
      PrismSuite(_Snoc.Array<number>()).prism(
        fc.array(fc.integer()),
        fc.tuple(fc.array(fc.integer()), fc.integer()),
        Eq.Array(Eq.fromUniversalEquals()),
        Eq.tuple(Eq.Array(Eq.fromUniversalEquals()), Eq.fromUniversalEquals()),
      ),
    );

    checkAll(
      'Prism<_Snoc.List>',
      PrismSuite(_Snoc.List<number>()).prism(
        CA.fp4tsList(fc.integer()),
        fc.tuple(CA.fp4tsList(fc.integer()), fc.integer()),
        List.Eq(Eq.fromUniversalEquals()),
        Eq.tuple(List.Eq(Eq.fromUniversalEquals()), Eq.fromUniversalEquals()),
      ),
    );

    checkAll(
      'Prism<_Snoc.LazyList>',
      PrismSuite(_Snoc.LazyList<number>()).prism(
        CA.fp4tsLazyList(fc.integer()),
        fc.tuple(CA.fp4tsLazyList(fc.integer()), fc.integer()),
        LazyList.EqK.liftEq(Eq.fromUniversalEquals()),
        Eq.tuple(
          LazyList.EqK.liftEq(Eq.fromUniversalEquals()),
          Eq.fromUniversalEquals(),
        ),
      ),
    );

    checkAll(
      'Prism<_Snoc.Seq>',
      PrismSuite(_Snoc.Seq<number>()).prism(
        CA.fp4tsSeq(fc.integer()),
        fc.tuple(CA.fp4tsSeq(fc.integer()), fc.integer()),
        Seq.Eq(Eq.fromUniversalEquals()),
        Eq.tuple(Seq.Eq(Eq.fromUniversalEquals()), Eq.fromUniversalEquals()),
      ),
    );

    checkAll(
      'Prism<_Snoc.Vector>',
      PrismSuite(_Snoc.Vector<number>()).prism(
        CA.fp4tsVector(fc.integer()),
        fc.tuple(CA.fp4tsVector(fc.integer()), fc.integer()),
        Vector.Eq(Eq.fromUniversalEquals()),
        Eq.tuple(Vector.Eq(Eq.fromUniversalEquals()), Eq.fromUniversalEquals()),
      ),
    );
  });
});
