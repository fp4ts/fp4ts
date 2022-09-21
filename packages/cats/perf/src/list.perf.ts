// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { suite, add, cycle, configure } from 'benny';
import { Eq } from '@fp4ts/cats-kernel';
import { Left, List, None, Right, Some } from '@fp4ts/cats-core/lib/data';
import { Eval } from '@fp4ts/cats-core';

function makeSuite(size: number) {
  const xs = [...new Array(size).keys()].map((_, i) => i);
  const values: List<number> = List.fromArray(xs);
  const mid: number = (size / 2) | 0;
  const last: number = Math.max(0, size - 1);
  const replacement: number = size * 2 + 1;
  const firstHalf: List<number> = values.take(size / 2);
  const lastHalf: List<number> = values.drop(size / 2);

  return [
    add(`fromArray (${size})`, () => {
      List.fromArray(xs);
    }),

    add(`equals (${size})`, () => {
      values.equals(Eq.fromUniversalEquals(), values);
    }),

    add(`elem mid (${size})`, () => {
      values['!?'](mid);
    }),
    add(`elem last (${size})`, () => {
      values['!?'](last);
    }),

    add(`append (${size})`, () => {
      values.append(replacement);
    }),

    add(`filter all (${size})`, () => {
      values.filter(() => false);
    }),

    add(`filter none (${size})`, () => {
      values.filter(() => true);
    }),

    add(`filter mid (${size})`, () => {
      values.filter(x => x !== mid);
    }),

    add(`collect all (${size})`, () => {
      values.collect(Some);
    }),
    add(`collect none (${size})`, () => {
      values.collect(() => None);
    }),
    add(`collect exclude mid (${size})`, () => {
      values.collect(x => (x !== mid ? Some(x) : None));
    }),

    add(`map converse identity (${size})`, () => {
      values.map(x => x);
    }),
    add(`map replace (${size})`, () => {
      values.map(() => replacement);
    }),

    add(`concat (${size})`, () => {
      firstHalf['+++'](lastHalf);
    }),

    add(`reverse (${size})`, () => {
      values.reverse;
    }),

    add(`foldLeft sum (${size})`, () => {
      values.foldLeft(0, (x, y) => x + y);
    }),
    add(`foldRight sum (${size})`, () => {
      values.foldRight(Eval.zero, (x, y) => y.map(y => x + y));
    }),
    add(`foldRight_ sum (${size})`, () => {
      values.foldRight_(0, (x, y) => x + y);
    }),

    add(`take (${size})`, () => {
      values.take(size);
    }),
    add(`takeRight (${size})`, () => {
      values.takeRight(size);
    }),

    add(`drop (${size})`, () => {
      values.drop(size);
    }),
    add(`dropRight (${size})`, () => {
      values.dropRight(size);
    }),

    add(`split at end (${size})`, () => {
      values.splitAt(last);
    }),
    add(`split at mid (${size})`, () => {
      values.splitAt(mid);
    }),

    add(`partition all left (${size})`, () => {
      values.partition(Left);
    }),
    add(`partition all right (${size})`, () => {
      values.partition(Right);
    }),
    add(`partition half left half right (${size})`, () => {
      values.partition(x => (x % 2 === 0 ? Right(x) : Left(x)));
    }),

    add(`flatMap into singleton (${size})`, () => {
      values.flatMap(x => List(x));
    }),

    add(`zipWith tupled (${size})`, () => {
      values.zipWith(values, (a, b) => [a, b]);
    }),

    add(`scanLeft sum (${size})`, () => {
      values.scanLeft(0, (x, y) => x + y);
    }),
    add(`scanRight sum (${size})`, () => {
      values.scanRight(0, (x, y) => x + y);
    }),
  ];
}

suite(
  'List',
  ...[0, 1, 10, 100, 1000].flatMap(makeSuite),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 2 } }),
);
