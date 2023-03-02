// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, List, None, Some } from '@fp4ts/cats';
import { Reader, State } from '@fp4ts/mtl';
import { deriveConstructors, Schema, Schemable } from '@fp4ts/schema';
import {
  all,
  any,
  find,
  isEmpty,
  modify,
  nonEmpty,
  prism_,
  replace,
  reuse,
  reverseGet,
  review,
  to,
  toList,
} from '@fp4ts/optics-core';
import { derivePrisms } from '@fp4ts/optics-derivation';
import { PrismSuite, TraversalSuite, SetterSuite } from '@fp4ts/optics-laws';
import { ArbitraryInstances } from '@fp4ts/schema-test-kit';
import { checkAll } from '@fp4ts/cats-test-kit';

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
    prism_<{ tag: 'i'; value: number }, number>(
      ({ value }) => Some(value),
      value => I({ value }),
    ),
  );
  const s = prsms.s.compose(
    prism_<{ tag: 's'; value: string }, string>(
      ({ value }) => Some(value),
      value => S({ value }),
    ),
  );

  // test('getOption', () => {
  //   expect(i.getOptional(I({ value: 42 }))).toEqual(Some(42));
  //   expect(i.getOptional(S({ value: '42' }))).toEqual(None);

  //   expect(s.getOptional(I({ value: 42 }))).toEqual(None);
  //   expect(s.getOptional(S({ value: '42' }))).toEqual(Some('42'));
  // });

  test('reverseGet', () => {
    expect(i.apply(reverseGet)(42)).toEqual(I({ value: 42 }));
    expect(s.apply(reverseGet)('42')).toEqual(S({ value: '42' }));
  });

  test('isEmpty', () => {
    expect(i.apply(isEmpty)(I({ value: 42 }))).toBe(false);
    expect(i.apply(isEmpty)(S({ value: '42' }))).toBe(true);

    expect(s.apply(isEmpty)(I({ value: 42 }))).toBe(true);
    expect(s.apply(isEmpty)(S({ value: '42' }))).toBe(false);
  });

  test('nonEmpty', () => {
    expect(i.apply(nonEmpty)(I({ value: 42 }))).toBe(true);
    expect(i.apply(nonEmpty)(S({ value: '42' }))).toBe(false);

    expect(s.apply(nonEmpty)(I({ value: 42 }))).toBe(false);
    expect(s.apply(nonEmpty)(S({ value: '42' }))).toBe(true);
  });

  test('find', () => {
    expect(i.apply(find)(x => x > 5)(I({ value: 42 }))).toEqual(Some(42));
    expect(i.apply(find)(x => x > 5)(I({ value: -42 }))).toEqual(None);
    expect(i.apply(find)(x => x > 5)(S({ value: '42' }))).toEqual(None);

    expect(s.apply(find)(x => x.length > 2)(S({ value: 'aaa' }))).toEqual(
      Some('aaa'),
    );
    expect(s.apply(find)(x => x.length > 2)(S({ value: 'aa' }))).toEqual(None);
    expect(s.apply(find)(x => x.length > 3)(I({ value: 42 }))).toEqual(None);
  });

  test('all', () => {
    expect(i.apply(all)(x => x > 5)(I({ value: 42 }))).toEqual(true);
    expect(i.apply(all)(x => x > 5)(I({ value: -42 }))).toEqual(false);
    expect(i.apply(all)(x => x > 5)(S({ value: '42' }))).toEqual(true);

    expect(s.apply(all)(x => x.length > 2)(S({ value: 'aaa' }))).toEqual(true);
    expect(s.apply(all)(x => x.length > 2)(S({ value: 'aa' }))).toEqual(false);
    expect(s.apply(all)(x => x.length > 3)(I({ value: 42 }))).toEqual(true);
  });

  test('any', () => {
    expect(i.apply(any)(x => x > 5)(I({ value: 42 }))).toEqual(true);
    expect(i.apply(any)(x => x > 5)(I({ value: -42 }))).toEqual(false);
    expect(i.apply(any)(x => x > 5)(S({ value: '42' }))).toEqual(false);

    expect(s.apply(any)(x => x.length > 2)(S({ value: 'aaa' }))).toEqual(true);
    expect(s.apply(any)(x => x.length > 2)(S({ value: 'aa' }))).toEqual(false);
    expect(s.apply(any)(x => x.length > 3)(I({ value: 42 }))).toEqual(false);
  });

  test('modify', () => {
    expect(i.apply(modify)(x => x + 1)(I({ value: 42 }))).toEqual(
      I({ value: 43 }),
    );
    expect(i.apply(modify)(x => x + 1)(S({ value: '' }))).toEqual(
      S({ value: '' }),
    );

    expect(s.apply(modify)(s => s.toUpperCase())(S({ value: 'aa' }))).toEqual(
      S({ value: 'AA' }),
    );
    expect(s.apply(modify)(s => s.toUpperCase())(I({ value: 42 }))).toEqual(
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
    expect(i.apply(replace)(1)(I({ value: 42 }))).toEqual(I({ value: 1 }));
    expect(i.apply(replace)(1)(S({ value: '' }))).toEqual(S({ value: '' }));

    expect(s.apply(replace)('')(S({ value: 'aa' }))).toEqual(S({ value: '' }));
    expect(s.apply(replace)('')(I({ value: 42 }))).toEqual(I({ value: 42 }));
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
    expect(i.apply(review(Reader.MonadReader<number>())).runReader(42)).toEqual(
      I({ value: 42 }),
    );
    expect(
      s.apply(review(Reader.MonadReader<string>())).runReader('42'),
    ).toEqual(S({ value: '42' }));
  });

  test('reuse', () => {
    expect(i.apply(reuse(State.MonadState<number>())).runAS(null, 42)).toEqual([
      I({ value: 42 }),
      42,
    ]);
    expect(
      s.apply(reuse(State.MonadState<string>())).runAS(null, '42'),
    ).toEqual([S({ value: '42' }), '42']);
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
      'prism.asTraversal',
      TraversalSuite(s).traversal(
        iorsArb,
        fc.string(),
        iorsEq,
        Eq.fromUniversalEquals(),
      ),
    );
    checkAll(
      'prism.asSetter',
      SetterSuite(s).setter(
        iorsArb,
        fc.string(),
        iorsEq,
        Eq.fromUniversalEquals(),
      ),
    );
  });
});
