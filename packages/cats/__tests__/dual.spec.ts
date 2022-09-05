// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Dual, List, Option, Some } from '@fp4ts/cats-core/lib/data';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { MonoidKSuite, MonoidSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Dual', () => {
  it('should concat string in reversed order', () => {
    expect(Dual.Monoid(Monoid.string).combine_('a', () => 'b')).toBe('ba');
  });

  it('should concat lists in reversed order', () => {
    expect(
      Dual.MonoidK(List.MonoidK).combineK_(List('a'), () => List('b')),
    ).toEqual(List('b', 'a'));
  });

  it('should concat options in reversed order', () => {
    expect(
      Dual.MonoidK(Option.MonoidK).combineK_(Some('a'), () => Some('b')),
    ).toEqual(Some('b'));
  });

  describe('Laws', () => {
    checkAll(
      'Dual.Monoid<number>',
      MonoidSuite(Dual.Monoid(Monoid.addition)).monoid(
        A.fp4tsDual(fc.integer()),
        Eq.primitive,
      ),
    );

    checkAll(
      'Dual.Monoid<string>',
      MonoidSuite(Dual.Monoid(Monoid.string)).monoid(
        A.fp4tsDual(fc.string()),
        Eq.primitive,
      ),
    );

    checkAll(
      'Dual.MonoidK<List<number>>',
      MonoidKSuite(Dual.MonoidK(List.MonoidK)).monoidK(
        fc.integer(),
        Eq.primitive,
        A.fp4tsList,
        List.Eq,
      ),
    );

    checkAll(
      'Dual.MonoidK<Option<string>>',
      MonoidKSuite(Dual.MonoidK(Option.MonoidK)).monoidK(
        fc.integer(),
        Eq.primitive,
        A.fp4tsOption,
        Option.Eq,
      ),
    );
  });
});
