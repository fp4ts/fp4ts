// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, List, None, Some } from '@fp4ts/cats';
import { Reader, State } from '@fp4ts/cats-mtl';
import { deriveConstructors, Schema, Schemable } from '@fp4ts/schema';
import { focus, Prism_ } from '@fp4ts/optics-core';
import { derivePrisms } from '@fp4ts/optics-derivation';
import {
  PrismSuite,
  OptionalSuite,
  TraversalSuite,
  SetterSuite,
} from '@fp4ts/optics-laws';
import { ArbitraryInstances } from '@fp4ts/schema-test-kit';
import { checkAll } from '@fp4ts/cats-test-kit';

describe('Prism', () => {
  const _IOrS = Schema.sum('tag')({
    i: Schema.struct({
      tag: Schema.literal('i'),
      value: Schema.number,
    }),
    s: Schema.struct({
      tag: Schema.literal('s'),
      value: Schema.string,
    }),
  });

  const { I, S } = deriveConstructors(_IOrS);
  const prsms = derivePrisms(_IOrS);
  const i = focus(prsms.i).andThen(
    Prism_<{ tag: 'i'; value: number }, number>(
      ({ value }) => Some(value),
      value => I({ value }),
    ),
  );
  const s = focus(prsms.s).andThen(
    Prism_<{ tag: 's'; value: string }, string>(
      ({ value }) => Some(value),
      value => S({ value }),
    ),
  );

  test('getOption', () => {
    expect(i.getOptional(I({ value: 42 }))).toEqual(Some(42));
    expect(i.getOptional(S({ value: '42' }))).toEqual(None);

    expect(s.getOptional(I({ value: 42 }))).toEqual(None);
    expect(s.getOptional(S({ value: '42' }))).toEqual(Some('42'));
  });

  test('reverseGet', () => {
    expect(i.reverseGet(42)).toEqual(I({ value: 42 }));
    expect(s.reverseGet('42')).toEqual(S({ value: '42' }));
  });

  test('isEmpty', () => {
    expect(i.isEmpty(I({ value: 42 }))).toBe(false);
    expect(i.isEmpty(S({ value: '42' }))).toBe(true);

    expect(s.isEmpty(I({ value: 42 }))).toBe(true);
    expect(s.isEmpty(S({ value: '42' }))).toBe(false);
  });

  test('nonEmpty', () => {
    expect(i.nonEmpty(I({ value: 42 }))).toBe(true);
    expect(i.nonEmpty(S({ value: '42' }))).toBe(false);

    expect(s.nonEmpty(I({ value: 42 }))).toBe(false);
    expect(s.nonEmpty(S({ value: '42' }))).toBe(true);
  });

  test('find', () => {
    expect(i.find(x => x > 5)(I({ value: 42 }))).toEqual(Some(42));
    expect(i.find(x => x > 5)(I({ value: -42 }))).toEqual(None);
    expect(i.find(x => x > 5)(S({ value: '42' }))).toEqual(None);

    expect(s.find(x => x.length > 2)(S({ value: 'aaa' }))).toEqual(Some('aaa'));
    expect(s.find(x => x.length > 2)(S({ value: 'aa' }))).toEqual(None);
    expect(s.find(x => x.length > 3)(I({ value: 42 }))).toEqual(None);
  });

  test('all', () => {
    expect(i.all(x => x > 5)(I({ value: 42 }))).toEqual(true);
    expect(i.all(x => x > 5)(I({ value: -42 }))).toEqual(false);
    expect(i.all(x => x > 5)(S({ value: '42' }))).toEqual(true);

    expect(s.all(x => x.length > 2)(S({ value: 'aaa' }))).toEqual(true);
    expect(s.all(x => x.length > 2)(S({ value: 'aa' }))).toEqual(false);
    expect(s.all(x => x.length > 3)(I({ value: 42 }))).toEqual(true);
  });

  test('any', () => {
    expect(i.any(x => x > 5)(I({ value: 42 }))).toEqual(true);
    expect(i.any(x => x > 5)(I({ value: -42 }))).toEqual(false);
    expect(i.any(x => x > 5)(S({ value: '42' }))).toEqual(false);

    expect(s.any(x => x.length > 2)(S({ value: 'aaa' }))).toEqual(true);
    expect(s.any(x => x.length > 2)(S({ value: 'aa' }))).toEqual(false);
    expect(s.any(x => x.length > 3)(I({ value: 42 }))).toEqual(false);
  });

  test('modify', () => {
    expect(i.modify(x => x + 1)(I({ value: 42 }))).toEqual(I({ value: 43 }));
    expect(i.modify(x => x + 1)(S({ value: '' }))).toEqual(S({ value: '' }));

    expect(s.modify(s => s.toUpperCase())(S({ value: 'aa' }))).toEqual(
      S({ value: 'AA' }),
    );
    expect(s.modify(s => s.toUpperCase())(I({ value: 42 }))).toEqual(
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
    expect(i.replace(1)(I({ value: 42 }))).toEqual(I({ value: 1 }));
    expect(i.replace(1)(S({ value: '' }))).toEqual(S({ value: '' }));

    expect(s.replace('')(S({ value: 'aa' }))).toEqual(S({ value: '' }));
    expect(s.replace('')(I({ value: 42 }))).toEqual(I({ value: 42 }));
  });

  // test('replaceOption', () => {
  //   expect(i.replaceOption(1)(I({ value: 42 }))).toEqual(Some(I({ value: 1 })));
  //   expect(i.replaceOption(1)(S({ value: '' }))).toEqual(None);

  //   expect(s.replaceOption('')(S({ value: 'aa' }))).toEqual(
  //     Some(S({ value: '' })),
  //   );
  //   expect(s.replaceOption('')(I({ value: 42 }))).toEqual(None);
  // });

  test('to', () => {
    expect(i.to(x => `${x}`).toList(I({ value: 42 }))).toEqual(List('42'));
    expect(i.to(x => `${x}`).toList(S({ value: '' }))).toEqual(List.empty);

    expect(s.to(x => x.toUpperCase()).toList(S({ value: 'aa' }))).toEqual(
      List('AA'),
    );
    expect(s.to(x => x.toUpperCase()).toList(I({ value: 42 }))).toEqual(
      List.empty,
    );
  });

  test('review', () => {
    expect(i.review(Reader.MonadReader<number>()).runReader(42)).toEqual(
      I({ value: 42 }),
    );
    expect(s.review(Reader.MonadReader<string>()).runReader('42')).toEqual(
      S({ value: '42' }),
    );
  });

  test('reuse', () => {
    expect(i.reuse(State.MonadState<number>()).runState(42)).toEqual([
      42,
      I({ value: 42 }),
    ]);
    expect(s.reuse(State.MonadState<string>()).runState('42')).toEqual([
      '42',
      S({ value: '42' }),
    ]);
  });

  describe('Laws', () => {
    const iorsArb = _IOrS.interpret(ArbitraryInstances.Schemable);
    const iorsEq = _IOrS.interpret(Schemable.Eq);

    checkAll(
      'Prism<I>',
      PrismSuite(i.toOptic).prism(iorsArb, fc.integer(), iorsEq, Eq.primitive),
    );
    checkAll(
      'Prism<S>',
      PrismSuite(s.toOptic).prism(iorsArb, fc.string(), iorsEq, Eq.primitive),
    );

    checkAll(
      'prism.asOptional',
      OptionalSuite(s.toOptic).optional(
        iorsArb,
        fc.string(),
        iorsEq,
        Eq.primitive,
      ),
    );
    checkAll(
      'prism.asTraversal',
      TraversalSuite(s.toOptic).traversal(
        iorsArb,
        fc.string(),
        iorsEq,
        Eq.primitive,
      ),
    );
    checkAll(
      'prism.asSetter',
      SetterSuite(s.toOptic).setter(iorsArb, fc.string(), iorsEq, Eq.primitive),
    );
  });
});
