// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { None, Some } from '@fp4ts/cats';
import { List } from '@fp4ts/collections';
import { forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/collections-test-kit/lib/arbitraries';
import { toposort } from '../toposort';

describe('toposort', () => {
  it('should sort an empty list', () => {
    expect(toposort(() => false, List.empty)).toEqual(Some(List.empty));
  });

  it('should sort a singleton list', () => {
    expect(toposort(() => false, List(42))).toEqual(Some(List(42)));
  });

  it(
    'should sort a graph without dependencies',
    forAll(A.fp4tsList(fc.integer()), xs =>
      expect(toposort(() => false, xs)).toEqual(Some(xs)),
    ),
  );

  it(
    'should sort list of numbers topologically (lo-to-hi)',
    forAll(A.fp4tsList(fc.integer()), xs =>
      expect(toposort((x, y) => x < y, xs).map(ys => ys.toArray)).toEqual(
        Some(xs.toArray.sort((x, y) => x - y)),
      ),
    ),
  );

  it(
    'should sort list of numbers topologically (hi-to-lo)',
    forAll(A.fp4tsList(fc.integer()), xs =>
      expect(toposort((x, y) => x > y, xs).map(ys => ys.toArray)).toEqual(
        Some(xs.toArray.sort((x, y) => y - x)),
      ),
    ),
  );

  it('should return None on a direct cycle', () => {
    expect(toposort(() => true, List(1, 2))).toEqual(None);
  });

  it('should return None on an indirect cycle', () => {
    const map = [[1], [2], [0]];
    expect(toposort((x, y) => map[y].includes(x), List(0, 1, 2))).toEqual(None);
  });

  it('should sort using the isParent predicate', () => {
    const map = [[1], [2], []];
    expect(toposort((x, y) => map[y].includes(x), List(0, 1, 2))).toEqual(
      Some(List(2, 1, 0)),
    );
  });
});
