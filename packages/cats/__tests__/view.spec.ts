// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { tupled } from '@fp4ts/core';
import { Eval } from '@fp4ts/cats-core';
import { List, Option, Some, View } from '@fp4ts/cats-core/lib/data';
import { forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Views', () => {
  describe('construction', () => {
    it(
      'fromArray toArray identity',
      forAll(fc.array(fc.integer()), xs =>
        expect(View.fromArray(xs).toArray).toEqual(xs),
      ),
    );

    it(
      'fromList toList identity',
      forAll(A.fp4tsList(fc.integer()), xs =>
        expect(View.fromList(xs).toList).toEqual(xs),
      ),
    );

    it(
      'fromLazyList toLazyList identity',
      forAll(A.fp4tsLazyList(fc.integer()), xs =>
        expect(View.fromLazyList(xs).toLazyList.toArray).toEqual(xs.toArray),
      ),
    );

    it(
      'fromVector toVector identity',
      forAll(A.fp4tsVector(fc.integer()), xs =>
        expect(View.fromVector(xs).toVector.toArray).toEqual(xs.toArray),
      ),
    );
  });

  describe('filter', () => {
    it(
      'should be Array.filter',
      forAll(
        A.fp4tsView(fc.integer()),
        fc.func<[number], boolean>(fc.boolean()),
        (xs, p) =>
          expect(xs.filter(p).toArray).toEqual(xs.toArray.filter(x => p(x))),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;
      View(1, 2, 3, 4)
        .map(x => (cnt++, x))
        .filter(() => true);
      expect(cnt).toBe(0);
    });
  });

  describe('filterNot', () => {
    it(
      'should be List.filter',
      forAll(
        A.fp4tsView(fc.integer()),
        fc.func<[number], boolean>(fc.boolean()),
        (xs, p) =>
          expect(xs.filterNot(p).toList).toEqual(
            xs.toList.filterNot(x => p(x)),
          ),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;
      View(1, 2, 3, 4)
        .map(x => (cnt++, x))
        .filter(() => true);
      expect(cnt).toBe(0);
    });
  });

  describe('collect', () => {
    it(
      'should be List.collect',
      forAll(
        A.fp4tsView(fc.integer()),
        fc.func<[number], Option<string>>(A.fp4tsOption(fc.string())),
        (xs, p) =>
          expect(xs.collect(p).toList).toEqual(xs.toList.collect(x => p(x))),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;
      View(1, 2, 3, 4)
        .map(x => (cnt++, x))
        .collect(Some);
      expect(cnt).toBe(0);
    });
  });

  describe('concat', () => {
    it(
      'should be List.concat',
      forAll(A.fp4tsView(fc.integer()), A.fp4tsView(fc.integer()), (xs, ys) =>
        expect(xs.concat(ys).toList).toEqual(xs.toList.concat(ys.toList)),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;
      View(1, 2, 3, 4)
        .map(x => (cnt++, x))
        .concat(View(3, 4, 5).map(x => (cnt++, x)));
      expect(cnt).toBe(0);
    });
  });

  describe('map', () => {
    it(
      'should be List.map',
      forAll(
        A.fp4tsView(fc.integer()),
        fc.func<[number], string>(fc.string()),
        (xs, f) => expect(xs.map(f).toList).toEqual(xs.toList.map(x => f(x))),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;
      View(1, 2, 3, 4).map(x => (cnt++, x));
      expect(cnt).toBe(0);
    });
  });

  describe('flatMap', () => {
    it(
      'should be List.map',
      forAll(
        A.fp4tsView(fc.integer()),
        fc.func<[number], List<string>>(A.fp4tsList(fc.string())),
        (xs, f) =>
          expect(xs.flatMap(f).toList).toEqual(xs.toList.flatMap(x => f(x))),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;
      View(1, 2, 3, 4)
        .map(x => (cnt++, x))
        .flatMap(View);
      expect(cnt).toBe(0);
    });
  });

  describe('zip', () => {
    it(
      'should be List.zip',
      forAll(A.fp4tsView(fc.integer()), A.fp4tsView(fc.integer()), (xs, ys) =>
        expect(xs.zip(ys).toList).toEqual(xs.toList.zip(ys.toList)),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;
      View(1, 2, 3, 4)
        .map(x => (cnt++, x))
        .zip(View(1, 2, 3).map(x => (cnt++, x)));

      expect(cnt).toBe(0);
    });
  });

  describe('zipWith', () => {
    it(
      'should be List.zipWith',
      forAll(
        A.fp4tsView(fc.integer()),
        A.fp4tsView(fc.integer()),
        fc.func<[number, number], string>(fc.string()),
        (xs, ys, f) =>
          expect(xs.zipWith(ys, f).toList).toEqual(
            xs.toList.zipWith(ys.toList, f),
          ),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;
      View(1, 2, 3, 4)
        .map(x => (cnt++, x))
        .zipWith(
          View(1, 2, 3).map(x => (cnt++, x)),
          tupled,
        );

      expect(cnt).toBe(0);
    });
  });

  test(
    'foldLeft is List.foldLeft',
    forAll(
      A.fp4tsView(fc.integer()),
      fc.string(),
      fc.func<[string, number], string>(fc.string()),
      (xs, z, f) => expect(xs.foldLeft(z, f)).toBe(xs.toList.foldLeft(z, f)),
    ),
  );

  test(
    'foldRight is List.foldRight',
    forAll(
      A.fp4tsView(fc.integer()),
      A.fp4tsEval(fc.string()),
      fc.func<[number, Eval<string>], Eval<string>>(A.fp4tsEval(fc.string())),
      (xs, ez, f) =>
        expect(xs.foldRight(ez, f).value).toBe(
          xs.toList.foldRight(ez, f).value,
        ),
    ),
  );

  test(
    'scanLeft is List.scanLeft',
    forAll(
      A.fp4tsView(fc.integer()),
      fc.string(),
      fc.func<[string, number], string>(fc.string()),
      (xs, z, f) =>
        expect(xs.scanLeft(z, f).toList).toEqual(xs.toList.scanLeft(z, f)),
    ),
  );
});
