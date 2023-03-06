// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, Iter, Monad, Monoid } from '@fp4ts/cats';
import { Seq } from '@fp4ts/collections-core';
import {
  MonadPlusSuite,
  TraversableFilterSuite,
  UnzipSuite,
} from '@fp4ts/cats-laws';
import { checkAll, forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as CA from '@fp4ts/collections-test-kit/lib/arbitraries';

describe('Seq', () => {
  test(
    'toList identity',
    forAll(CA.fp4tsList(fc.integer()), xs =>
      expect(Seq.fromList(xs).toList).toEqual(xs),
    ),
  );

  test(
    'toArray identity',
    forAll(fc.array(fc.integer()), xs =>
      expect(Seq.fromArray(xs).toArray).toEqual(xs),
    ),
  );

  test(
    'iterator identity',
    forAll(fc.array(fc.integer()), xs =>
      expect(
        Iter.toArray(Seq.fromIterator(xs[Symbol.iterator]()).iterator),
      ).toEqual(xs),
    ),
  );

  test(
    'head to be List.head',
    forAll(CA.fp4tsSeq(fc.integer()), xs =>
      xs.isEmpty
        ? expect(() => xs.head).toThrow()
        : expect(xs.head).toBe(xs.toList.head),
    ),
  );

  test(
    'headOption to be List.headOption',
    forAll(CA.fp4tsSeq(fc.integer()), xs =>
      expect(xs.headOption).toEqual(xs.toList.headOption),
    ),
  );

  test(
    'tail to be List.tail',
    forAll(CA.fp4tsSeq(fc.integer()), xs =>
      expect(xs.tail.toList).toEqual(xs.toList.tail),
    ),
  );

  test(
    'uncons to be List.uncons',
    forAll(CA.fp4tsSeq(fc.integer()), xs =>
      expect(xs.uncons.map(([h, tl]) => [h, tl.toList])).toEqual(
        xs.toList.uncons,
      ),
    ),
  );

  test(
    'last to be List.last',
    forAll(CA.fp4tsSeq(fc.integer()), xs =>
      xs.isEmpty
        ? expect(() => xs.last).toThrow()
        : expect(xs.last).toBe(xs.toList.last),
    ),
  );

  test(
    'lastOption to be List.lastOption',
    forAll(CA.fp4tsSeq(fc.integer()), xs =>
      expect(xs.lastOption).toEqual(xs.toList.lastOption),
    ),
  );

  test(
    'init to be List.init',
    forAll(CA.fp4tsSeq(fc.integer()), xs =>
      expect(xs.init.toList).toEqual(xs.toList.init),
    ),
  );

  test(
    'popLast to be List.popLast',
    forAll(CA.fp4tsSeq(fc.integer()), xs =>
      expect(xs.popLast.map(([h, tl]) => [h, tl.toList])).toEqual(
        xs.toList.popLast,
      ),
    ),
  );

  test(
    'isEmpty to be List.isEmpty',
    forAll(CA.fp4tsSeq(fc.integer()), xs =>
      expect(xs.isEmpty).toBe(xs.toList.isEmpty),
    ),
  );

  test(
    'nonEmpty to be List.nonEmpty',
    forAll(CA.fp4tsSeq(fc.integer()), xs =>
      expect(xs.nonEmpty).toBe(xs.toList.nonEmpty),
    ),
  );

  test(
    'size to be List.size',
    forAll(CA.fp4tsSeq(fc.integer()), xs =>
      expect(xs.size).toBe(xs.toList.size),
    ),
  );

  test(
    'view to be List.view',
    forAll(CA.fp4tsSeq(fc.integer()), xs =>
      expect(xs.view.toArray).toEqual(xs.toList.view.toArray),
    ),
  );

  test(
    'view to be reverse.view',
    forAll(CA.fp4tsSeq(fc.integer()), xs =>
      expect(xs.viewRight.toArray).toEqual(xs.reverse.view.toArray),
    ),
  );

  test(
    'reverseIterator to be .reverse.iterator',
    forAll(CA.fp4tsSeq(fc.integer()), xs =>
      expect(Iter.toArray(xs.reverseIterator)).toEqual(
        Iter.toArray(xs.reverse.iterator),
      ),
    ),
  );

  test(
    'prepend is List.prepend',
    forAll(CA.fp4tsSeq(fc.integer()), fc.integer(), (xs, x) =>
      expect(xs.prepend(x).toList).toEqual(xs.toList.prepend(x)),
    ),
  );
  test(
    'append is List.append',
    forAll(CA.fp4tsSeq(fc.integer()), fc.integer(), (xs, x) =>
      expect(xs.append(x).toList).toEqual(xs.toList.append(x)),
    ),
  );
  test(
    'all is List.all',
    forAll(CA.fp4tsSeq(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
      expect(xs.all(p)).toEqual(xs.toList.all(p)),
    ),
  );
  test(
    'any is List.any',
    forAll(CA.fp4tsSeq(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
      expect(xs.any(p)).toEqual(xs.toList.any(p)),
    ),
  );
  test(
    'count is List.count',
    forAll(CA.fp4tsSeq(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
      expect(xs.count(p)).toEqual(xs.toList.count(p)),
    ),
  );

  test(
    'take to be List.take',
    forAll(CA.fp4tsSeq(fc.integer()), fc.integer(), (xs, n) =>
      expect(xs.take(n).toList).toEqual(xs.toList.take(n)),
    ),
  );
  test(
    'drop to be List.drop',
    forAll(CA.fp4tsSeq(fc.integer()), fc.integer(), (xs, n) =>
      expect(xs.drop(n).toList).toEqual(xs.toList.drop(n)),
    ),
  );
  test('drop off by one bug', () => {
    fc.assert(
      fc.property(CA.fp4tsSeq(fc.integer()), fc.integer(), (xs, n) =>
        expect(xs.drop(n).toArray).toEqual(xs.toList.drop(n).toArray),
      ),
      {
        seed: 1076006081,
        path: '90:4:7:11:14:17:20:23:25:27:28:31:33:33:33',
        endOnFailure: true,
      },
    );
  });
  test(
    'slice to be List.slice',
    forAll(CA.fp4tsSeq(fc.integer()), fc.integer(), fc.integer(), (xs, n, m) =>
      expect(xs.slice(n, m).toList).toEqual(xs.toList.slice(n, m)),
    ),
  );

  test(
    'splitAt to be List.splitAt',
    forAll(CA.fp4tsSeq(fc.integer()), fc.integer(), (xs, n) =>
      expect(xs.splitAt(n).map(xs => xs.toList)).toEqual(xs.toList.splitAt(n)),
    ),
  );

  test(
    'takeWhile to be List.takeWhile',
    forAll(CA.fp4tsSeq(fc.integer()), fc.func(fc.boolean()), (xs, f) =>
      expect(xs.takeWhile(f).toList).toEqual(xs.toList.takeWhile(f)),
    ),
  );
  test(
    'dropWhile to be List.dropWhile',
    forAll(CA.fp4tsSeq(fc.integer()), fc.func(fc.boolean()), (xs, f) =>
      expect(xs.dropWhile(f).toList).toEqual(xs.toList.dropWhile(f)),
    ),
  );
  test('#dropWhile to be List.dropWhile', () => {
    fc.assert(
      fc.property(CA.fp4tsSeq(fc.integer()), fc.func(fc.boolean()), (xs, f) => {
        expect(xs.dropWhile(f).toArray).toEqual(xs.toList.dropWhile(f).toArray);
      }),
      {
        seed: 162552452,
        path: '57:4:7:11:14:18:21:17:17:17:17:20:19:18:19:18:23:21:24:26:28:29:33:36:40:43:46:49:52:54:56:57:58:17:18:17:17:18:25:23:17:18:18:62:18:17:57:17:60:59',
        endOnFailure: true,
      },
    );
  });
  test(
    'span to be List.span',
    forAll(CA.fp4tsSeq(fc.integer()), fc.func(fc.boolean()), (xs, f) =>
      expect(xs.span(f).map(xs => xs.toList)).toEqual(xs.toList.span(f)),
    ),
  );

  test(
    'takeRight to be List.takeRight',
    forAll(CA.fp4tsSeq(fc.integer()), fc.integer(), (xs, n) =>
      expect(xs.takeRight(n).toList).toEqual(xs.toList.takeRight(n)),
    ),
  );
  test(
    'dropRight to be List.dropRight',
    forAll(CA.fp4tsSeq(fc.integer()), fc.integer(), (xs, n) =>
      expect(xs.dropRight(n).toList).toEqual(xs.toList.dropRight(n)),
    ),
  );
  test(
    'takeWhileRight to be .reverse.takeWhile.reverse',
    forAll(CA.fp4tsSeq(fc.integer()), fc.func(fc.boolean()), (xs, f) =>
      expect(xs.takeWhileRight(f).toArray).toEqual(
        xs.reverse.takeWhile(f).reverse.toArray,
      ),
    ),
  );
  test(
    'dropWhileRight to be .reverse.dropWhile.reverse',
    forAll(CA.fp4tsSeq(fc.integer()), fc.func(fc.boolean()), (xs, f) =>
      expect(xs.dropWhileRight(f).toArray).toEqual(
        xs.reverse.dropWhile(f).reverse.toArray,
      ),
    ),
  );
  test('#dropWhileRight to be .reverse.dropWhile.reverse', () => {
    fc.assert(
      fc.property(CA.fp4tsSeq(fc.integer()), fc.func(fc.boolean()), (xs, f) =>
        expect(xs.dropWhileRight(f).toArray).toEqual(
          xs.reverse.dropWhile(f).reverse.toArray,
        ),
      ),
      {
        seed: -362902510,
        path: '65:3:1:5:8:15:17:19:11:14:18:20:21:23:24:25:35:34:11:12:12:21:11:12:11:11:11:11:11:11:11:11:11:12:12:11:13:11:11:12:11:14:11:11:11',
        endOnFailure: true,
      },
    );
  });
  test(
    'spanRight to be [takeWhileRight(p), dropWhileRight(p)]',
    forAll(CA.fp4tsSeq(fc.integer()), fc.func(fc.boolean()), (xs, f) =>
      expect(xs.spanRight(f).map(xs => xs.toArray)).toEqual([
        xs.dropWhileRight(f).toArray,
        xs.takeWhileRight(f).toArray,
      ]),
    ),
  );

  test(
    'inits to be List.inits',
    forAll(CA.fp4tsSeq(fc.integer()), xs =>
      expect(xs.inits().map(xs => xs.toList).toArray).toEqual(
        xs.toList.inits().toArray,
      ),
    ),
  );
  test(
    'tails to be List.tails',
    forAll(CA.fp4tsSeq(fc.integer()), xs =>
      expect(xs.tails().map(xs => xs.toList).toArray).toEqual(
        xs.toList.tails().toArray,
      ),
    ),
  );

  test(
    'elem to be List.elem',
    forAll(CA.fp4tsSeq(fc.integer()), fc.integer(), (xs, x) =>
      expect(xs.elem(x)).toBe(xs.toList.elem(x)),
    ),
  );
  test(
    'notElem to be elem',
    forAll(CA.fp4tsSeq(fc.integer()), fc.integer(), (xs, x) =>
      expect(xs.notElem(x)).toBe(!xs.elem(x)),
    ),
  );

  test(
    'lookup to be List.lookup',
    forAll(
      CA.fp4tsSeq(fc.tuple(fc.integer(), fc.string())),
      fc.integer(),
      (xs, x) => expect(xs.lookup(x)).toEqual(xs.toList.lookup(x)),
    ),
  );

  test(
    'find to be List.find',
    forAll(CA.fp4tsSeq(fc.integer()), fc.func(fc.boolean()), (xs, f) =>
      expect(xs.find(f)).toEqual(xs.toList.find(f)),
    ),
  );

  test(
    'filter to be List.filter',
    forAll(CA.fp4tsSeq(fc.integer()), fc.func(fc.boolean()), (xs, f) =>
      expect(xs.filter(f).toList).toEqual(xs.toList.filter(f)),
    ),
  );

  test(
    'filterNot to be filter(not(f))',
    forAll(CA.fp4tsSeq(fc.integer()), fc.func(fc.boolean()), (xs, f) =>
      expect(xs.filterNot(f).toArray).toEqual(xs.filter(x => !f(x)).toArray),
    ),
  );

  test(
    'collect to be List.collect',
    forAll(
      CA.fp4tsSeq(fc.integer()),
      fc.func(A.fp4tsOption(fc.string())),
      (xs, f) => expect(xs.collect(f).toList).toEqual(xs.toList.collect(f)),
    ),
  );

  test(
    'collectWhile to be List.collectWhile',
    forAll(
      CA.fp4tsSeq(fc.integer()),
      fc.func(A.fp4tsOption(fc.string())),
      (xs, f) =>
        expect(xs.collectWhile(f).toList).toEqual(xs.toList.collectWhile(f)),
    ),
  );

  test(
    'collectWhileRight to be reverse.collectWhile.reverse',
    forAll(
      CA.fp4tsSeq(fc.integer()),
      fc.func(A.fp4tsOption(fc.string())),
      (xs, f) =>
        expect(xs.collectWhileRight(f).toArray).toEqual(
          xs.reverse.collectWhile(f).reverse.toArray,
        ),
    ),
  );

  test(
    'partition to be List.partition',
    forAll(CA.fp4tsSeq(fc.integer()), fc.func(fc.boolean()), (xs, f) =>
      expect(xs.partition(f).map(xs => xs.toList)).toEqual(
        xs.toList.partition(f),
      ),
    ),
  );

  test(
    'partitionWith to be List.partitionWith',
    forAll(
      CA.fp4tsSeq(fc.integer()),
      fc.func(A.fp4tsEither(fc.integer(), fc.string())),
      (xs, f) =>
        expect(xs.partitionWith(f).map(xs => xs.toList)).toEqual(
          xs.toList.partitionWith(f),
        ),
    ),
  );

  test(
    'get to be List.get',
    forAll(CA.fp4tsSeq(fc.integer()), fc.integer(), (xs, idx) =>
      idx < 0 || idx >= xs.size
        ? expect(() => xs.get(idx)).toThrow()
        : expect(xs['!!'](idx)).toEqual(xs.toList.get(idx)),
    ),
  );
  test(
    'getOption to be List.getOption',
    forAll(CA.fp4tsSeq(fc.integer()), fc.integer(), (xs, idx) =>
      expect(xs['!?'](idx)).toEqual(xs.toList.getOption(idx)),
    ),
  );

  test(
    'replaceAt to be List.replaceAt',
    forAll(
      CA.fp4tsSeq(fc.integer()),
      fc.integer(),
      fc.integer(),
      (xs, idx, x) =>
        idx < 0 || idx >= xs.size
          ? expect(() => xs.replaceAt(idx, x)).toThrow()
          : expect(xs.replaceAt(idx, x).toList).toEqual(
              xs.toList.replaceAt(idx, x),
            ),
    ),
  );
  test('#replaceAt to be List.replaceAt', () => {
    fc.assert(
      fc.property(
        CA.fp4tsSeq(fc.integer()),
        fc.integer(),
        fc.integer(),
        (xs, idx, x) =>
          idx < 0 || idx >= xs.size
            ? expect(() => xs.replaceAt(idx, x)).toThrow()
            : expect(xs.replaceAt(idx, x).toList).toEqual(
                xs.toList.replaceAt(idx, x),
              ),
      ),
      {
        seed: -817654794,
        path: '48:3:1:5:8:11:13:15:16:18:18:19:18:19',
        endOnFailure: true,
      },
    );
  });
  test('#2replaceAt to be List.replaceAt', () => {
    fc.assert(
      fc.property(
        CA.fp4tsSeq(fc.integer()),
        fc.integer(),
        fc.integer(),
        (xs, idx, x) =>
          idx < 0 || idx >= xs.size
            ? expect(() => xs.replaceAt(idx, x)).toThrow()
            : expect(xs.replaceAt(idx, x).toArray).toEqual(
                xs.toList.replaceAt(idx, x).toArray,
              ),
      ),
      {
        seed: 562858619,
        path: '37:3:5:8:11:13:15:16:20:23:27:30:33:36:39:41:43:44:46',
        endOnFailure: true,
      },
    );
  });

  test(
    'insertAt to be List.insertAt',
    forAll(
      CA.fp4tsSeq(fc.integer()),
      fc.integer(),
      fc.integer(),
      (xs, idx, x) =>
        idx < 0 || idx > xs.size
          ? expect(() => xs.insertAt(idx, x)).toThrow()
          : expect(xs.insertAt(idx, x).toList).toEqual(
              xs.toList.insertAt(idx, x),
            ),
    ),
  );

  test(
    'removeAt to be List.removeAt',
    forAll(CA.fp4tsSeq(fc.integer()), fc.integer(), (xs, idx) =>
      idx < 0 || idx >= xs.size
        ? expect(() => xs.removeAt(idx)).toThrow()
        : expect(xs.removeAt(idx).toList).toEqual(xs.toList.removeAt(idx)),
    ),
  );

  test(
    'elemIndex to be List.elemIndex',
    forAll(CA.fp4tsSeq(fc.integer()), fc.integer(), (xs, x) =>
      expect(xs.elemIndex(x)).toEqual(xs.toList.elemIndex(x)),
    ),
  );

  test(
    'elemIndices to be List.elemIndices',
    forAll(CA.fp4tsSeq(fc.integer()), fc.integer(), (xs, x) =>
      expect(xs.elemIndices(x).toList).toEqual(xs.toList.elemIndices(x)),
    ),
  );

  test(
    'elemIndexRight to be .reverse.elemIndex.map(idx => size - idx - 1)',
    forAll(CA.fp4tsSeq(fc.integer()), fc.integer(), (xs, x) =>
      expect(xs.elemIndexRight(x)).toEqual(
        xs.reverse.elemIndex(x).map(idx => xs.size - idx - 1),
      ),
    ),
  );

  test(
    'elemIndicesRight to be .reverse.elemIndices.map(idx => size - idx - 1)',
    forAll(CA.fp4tsSeq(fc.integer()), fc.integer(), (xs, x) =>
      expect(xs.elemIndicesRight(x).toArray).toEqual(
        xs.reverse.elemIndices(x).map(idx => xs.size - idx - 1).toArray,
      ),
    ),
  );

  test(
    'reverse to be List.reverse',
    forAll(CA.fp4tsSeq(fc.integer()), xs =>
      expect(xs.reverse.toList).toEqual(xs.toList.reverse),
    ),
  );

  test(
    'reverse.reverse identity',
    forAll(CA.fp4tsSeq(fc.integer()), xs =>
      expect(xs.reverse.reverse).toEqual(xs),
    ),
  );

  test(
    'concat to be List.concat',
    forAll(CA.fp4tsSeq(fc.integer()), CA.fp4tsSeq(fc.integer()), (xs, ys) =>
      expect(xs['++'](ys).toArray).toEqual(xs.toList.concat(ys.toList).toArray),
    ),
  );

  test(
    'map to be List.map',
    forAll(CA.fp4tsSeq(fc.integer()), fc.func(fc.string()), (xs, f) =>
      expect(xs.map(f).toList).toEqual(xs.toList.map(f)),
    ),
  );

  test(
    'intersperse to be List.intersperse',
    forAll(CA.fp4tsSeq(fc.integer()), fc.integer(), (xs, x) =>
      expect(xs.intersperse(x).toList).toEqual(xs.toList.intersperse(x)),
    ),
  );

  test(
    'transpose to be List.transpose',
    forAll(CA.fp4tsSeq(CA.fp4tsSeq(fc.integer())), xss =>
      expect(xss.transpose().map(xs => xs.toList).toList).toEqual(
        xss.map(xs => xs.toList).toList.transpose(),
      ),
    ),
  );

  // test(
  //   'subsequences to be List.subsequences',
  //   forAll(CA.fp4tsSeq(fc.integer()), xss =>
  //     expect(xss.subsequences().map(xs => xs.toList).toArray).toEqual(
  //       xss.toList.subsequences().toArray,
  //     ),
  //   ),
  // );

  test(
    'zip to be List.zip',
    forAll(CA.fp4tsSeq(fc.integer()), CA.fp4tsSeq(fc.integer()), (xs, ys) =>
      expect(xs.zip(ys).toList).toEqual(xs.toList.zip(ys.toList)),
    ),
  );

  test(
    'zipView to be List.zipView',
    forAll(CA.fp4tsSeq(fc.integer()), CA.fp4tsSeq(fc.integer()), (xs, ys) =>
      expect(xs.zipView(ys).toArray).toEqual(
        xs.toList.zipView(ys.toList).toArray,
      ),
    ),
  );

  test(
    'zip3 to be List.zip3',
    forAll(
      CA.fp4tsSeq(fc.integer()),
      CA.fp4tsSeq(fc.integer()),
      CA.fp4tsSeq(fc.integer()),
      (xs, ys, zs) =>
        expect(xs.zip3(ys, zs).toList).toEqual(
          xs.toList.zip3(ys.toList, zs.toList),
        ),
    ),
  );

  test('#zip to be List.zip', () => {
    fc.assert(
      fc.property(
        CA.fp4tsSeq(fc.integer()),
        CA.fp4tsSeq(fc.integer()),
        (xs, ys) => {
          expect(xs.zip(ys).toList).toEqual(xs.toList.zip(ys.toList));
        },
      ),
      {
        seed: 309885991,
        path: '3132:4:7:11:14:17:20:23:25:27:28:32:35:39:42:45:48:51:53:55:56:58:57:61:64:67:69:71:72:75:77:80:83:85:87:88',
        endOnFailure: true,
      },
    );
  });

  // test('#zip commutativity', () => {
  //   fc.assert(
  //     fc.property(
  //       CA.fp4tsSeq(fc.integer()),
  //       CA.fp4tsSeq(fc.integer()),
  //       (xs, ys) => {
  //         expect(xs.zip(ys).toArray).toEqual(
  //           ys.zip(xs).map(([b, a]) => [a, b]).toArray,
  //         );
  //       },
  //     ),
  //     {
  //       seed: 1461230723,
  //       path: '49:8:11:14:17:20:23:25:27:28:32:35:39:42:45:48:51:53:55:56:58:57:61:64:67:69:71:72:76:78:81:84:87:89:91:92',
  //       endOnFailure: true,
  //     },
  //   );
  // });

  test(
    'unzip to be List.unzip',
    forAll(CA.fp4tsSeq(fc.tuple(fc.integer(), fc.integer())), xs =>
      expect(xs.unzip().map(x => x.toList)).toEqual(xs.toList.unzip()),
    ),
  );

  test(
    'unzip3 to be List.unzip3',
    forAll(
      CA.fp4tsSeq(fc.tuple(fc.integer(), fc.integer(), fc.integer())),
      xs => expect(xs.unzip3().map(x => x.toList)).toEqual(xs.toList.unzip3()),
    ),
  );

  test(
    'scanLeft to be List.scanLeft',
    forAll(
      CA.fp4tsSeq(fc.integer()),
      fc.string(),
      fc.func(fc.string()),
      (xs, z, f) =>
        expect(xs.scanLeft(z, f).toList).toEqual(xs.toList.scanLeft(z, f)),
    ),
  );

  test(
    'scanLeft1 to be List.scanLeft1',
    forAll(CA.fp4tsSeq(fc.integer()), fc.func(fc.integer()), (xs, f) =>
      expect(xs.scanLeft1(f).toList).toEqual(xs.toList.scanLeft1(f)),
    ),
  );

  test(
    'scanRight to be List.scanRight',
    forAll(
      CA.fp4tsSeq(fc.integer()),
      fc.string(),
      fc.func(fc.string()),
      (xs, z, f) =>
        expect(xs.scanRight_(z, f).toList).toEqual(xs.toList.scanRight_(z, f)),
    ),
  );

  test(
    'scanRight1 to be List.scanRight1',
    forAll(CA.fp4tsSeq(fc.integer()), fc.func(fc.integer()), (xs, f) =>
      expect(xs.scanRight1_(f).toList).toEqual(xs.toList.scanRight1_(f)),
    ),
  );

  test(
    'foldLeft to be List.foldLeft',
    forAll(
      CA.fp4tsSeq(fc.integer()),
      fc.string(),
      fc.func(fc.string()),
      (xs, z, f) => expect(xs.foldLeft(z, f)).toEqual(xs.toList.foldLeft(z, f)),
    ),
  );

  test(
    'foldLeft1 to be List.foldLeft1',
    forAll(CA.fp4tsSeq(fc.integer()), fc.func(fc.integer()), (xs, f) =>
      xs.isEmpty
        ? expect(() => xs.foldLeft1(f)).toThrow()
        : expect(xs.foldLeft1(f)).toEqual(xs.toList.foldLeft1(f)),
    ),
  );

  test(
    'foldRight to be List.foldRight',
    forAll(
      CA.fp4tsSeq(fc.integer()),
      A.fp4tsEval(fc.string()),
      fc.func(A.fp4tsEval(fc.string())),
      (xs, z, f) =>
        expect(xs.foldRight(z, f).value).toEqual(
          xs.toList.foldRight(z, f).value,
        ),
    ),
  );

  test(
    'foldRight1 to be List.foldRight1',
    forAll(
      CA.fp4tsSeq(fc.integer()),
      fc.func(A.fp4tsEval(fc.integer())),
      (xs, f) =>
        xs.isEmpty
          ? expect(() => xs.foldRight1(f).value).toThrow()
          : expect(xs.foldRight1(f).value).toEqual(
              xs.toList.foldRight1(f).value,
            ),
    ),
  );

  test(
    'foldRight_ to be List.foldRight_',
    forAll(
      CA.fp4tsSeq(fc.integer()),
      fc.string(),
      fc.func(fc.string()),
      (xs, z, f) =>
        expect(xs.foldRight_(z, f)).toEqual(xs.toList.foldRight_(z, f)),
    ),
  );

  test(
    'foldRight1_ to be List.foldRight1_',
    forAll(CA.fp4tsSeq(fc.integer()), fc.func(fc.integer()), (xs, f) =>
      xs.isEmpty
        ? expect(() => xs.foldRight1_(f)).toThrow()
        : expect(xs.foldRight1_(f)).toEqual(xs.toList.foldRight1_(f)),
    ),
  );

  test(
    'equals to be List.equals',
    forAll(
      CA.fp4tsSeq(fc.integer()),
      CA.fp4tsSeq(fc.integer()),
      (xs, ys) => xs.equals(ys) === xs.toList.equals(ys.toList),
    ),
  );

  describe('Laws', () => {
    checkAll(
      'MonadPlus<Seq>',
      MonadPlusSuite(Seq.MonadPlus).monadPlus(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        CA.fp4tsSeq,
        Seq.Eq,
      ),
    );

    checkAll(
      'TraversableFilter<Seq>',
      TraversableFilterSuite(Seq.TraversableFilter).traversableFilter(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Monoid.addition,
        Monoid.addition,
        Seq.TraversableFilter,
        Monad.Eval,
        Monad.Eval,
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        CA.fp4tsSeq,
        Seq.EqK.liftEq,
        A.fp4tsEval,
        Eq.Eval,
        A.fp4tsEval,
        Eq.Eval,
      ),
    );

    checkAll(
      'Unzip<Seq>',
      UnzipSuite(Seq.Unzip).unzip(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        CA.fp4tsSeq,
        Seq.EqK.liftEq,
      ),
    );
  });
});
