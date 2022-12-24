// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eval, tupled } from '@fp4ts/core';
import { Eq, Monoid, Ord } from '@fp4ts/cats-kernel';
import { List, Option, Some, View } from '@fp4ts/cats-core/lib/data';
import {
  AlignSuite,
  FoldableSuite,
  FunctorFilterSuite,
  MonoidKSuite,
} from '@fp4ts/cats-laws';
import { checkAll, forAll } from '@fp4ts/cats-test-kit';
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
        expect(xs.view.toList).toEqual(xs),
      ),
    );

    it(
      'fromLazyList toLazyList identity',
      forAll(A.fp4tsLazyList(fc.integer()), xs =>
        expect(xs.view.toLazyList.toArray).toEqual(xs.toArray),
      ),
    );

    it(
      'fromVector toVector identity',
      forAll(A.fp4tsVector(fc.integer()), xs =>
        expect(xs.view.toVector.toArray).toEqual(xs.toArray),
      ),
    );
  });

  describe('take', () => {
    it(
      'should be List.take',
      forAll(A.fp4tsView(fc.integer()), fc.integer(), (xs, n) =>
        expect(xs.take(n).toList).toEqual(xs.toList.take(n)),
      ),
    );
  });

  describe('drop', () => {
    it(
      'should be List.drop',
      forAll(A.fp4tsView(fc.integer()), fc.integer(), (xs, n) =>
        expect(xs.drop(n).toList).toEqual(xs.toList.drop(n)),
      ),
    );
  });

  describe('filter', () => {
    it(
      'should be List.filter',
      forAll(
        A.fp4tsView(fc.integer()),
        fc.func<[number], boolean>(fc.boolean()),
        (xs, p) => expect(xs.filter(p).toList).toEqual(xs.toList.filter(p)),
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
    'foldMap is List.foldMap',
    forAll(A.fp4tsView(fc.integer()), fc.func(fc.integer()), (xs, f) =>
      expect(xs.foldMap(Monoid.addition)(f)).toEqual(
        xs.toList.foldMap(Monoid.addition)(f),
      ),
    ),
  );

  test(
    'foldMapLeft is List.foldMapLeft',
    forAll(A.fp4tsView(fc.integer()), fc.func(fc.integer()), (xs, f) =>
      expect(xs.foldMapLeft(Monoid.addition)(f)).toEqual(
        xs.toList.foldMapLeft(Monoid.addition)(f),
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

  test(
    'distinct is List.distinct',
    forAll(A.fp4tsView(fc.integer()), xs =>
      expect(xs.distinct().toList).toEqual(xs.toList.distinct()),
    ),
  );

  test(
    'distinctBy is List.distinctBy',
    forAll(A.fp4tsView(fc.integer()), fc.func(fc.integer()), (xs, f) =>
      expect(xs.distinctBy(f).toList).toEqual(xs.toList.distinctBy(f)),
    ),
  );

  test(
    'distinctOrd is List.distinctOrd',
    forAll(A.fp4tsView(fc.integer()), xs =>
      expect(xs.distinctOrd(Ord.fromUniversalCompare()).toList).toEqual(
        xs.toList.distinctOrd(Ord.fromUniversalCompare()),
      ),
    ),
  );

  test(
    'distinctByOrd is List.distinctByOrd',
    forAll(A.fp4tsView(fc.integer()), fc.func(fc.integer()), (xs, f) =>
      expect(xs.distinctByOrd(f, Ord.fromUniversalCompare()).toList).toEqual(
        xs.toList.distinctByOrd(f, Ord.fromUniversalCompare()),
      ),
    ),
  );

  describe('Laws', () => {
    checkAll(
      'FunctorFilter<View>',
      FunctorFilterSuite(View.FunctorFilter).functorFilter(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsView,
        <X>(E: Eq<X>) => Eq.by<View<X>, List<X>>(List.Eq(E), xs => xs.toList),
      ),
    );

    checkAll(
      'Align<View>',
      AlignSuite(View.Align).align(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsView,
        <X>(E: Eq<X>) => Eq.by<View<X>, List<X>>(List.Eq(E), xs => xs.toList),
      ),
    );

    checkAll(
      'Foldable<View>',
      FoldableSuite(View.Foldable).foldable(
        fc.integer(),
        fc.integer(),
        Monoid.addition,
        Monoid.addition,
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsView,
      ),
    );

    checkAll(
      'MonoidK<View>',
      MonoidKSuite(View.MonoidK).monoidK(
        fc.integer(),
        Eq.fromUniversalEquals(),
        A.fp4tsView,
        <X>(E: Eq<X>) => Eq.by<View<X>, List<X>>(List.Eq(E), xs => xs.toList),
      ),
    );
  });
});

abstract class Action<A, B> {
  public abstract runOnView(xs: View<A>): View<B>;
  public abstract runOnList(xs: List<A>): List<B>;
}

class PrependAction<A> extends Action<A, A> {
  readonly name = 'Prepend';
  public constructor(public readonly value: A) {
    super();
  }

  public runOnView(xs: View<A>): View<A> {
    return xs.prepend(this.value);
  }
  public runOnList(xs: List<A>): List<A> {
    return xs.prepend(this.value);
  }

  static readonly Arb = fc.integer().map(x => new PrependAction(x));
}
class AppendAction<A> extends Action<A, A> {
  readonly name = 'Append';
  public constructor(public readonly value: A) {
    super();
  }

  public runOnView(xs: View<A>): View<A> {
    return xs.append(this.value);
  }
  public runOnList(xs: List<A>): List<A> {
    return xs.append(this.value);
  }

  static readonly Arb = fc.integer().map(x => new AppendAction(x));
}
class TakeAction<A> extends Action<A, A> {
  readonly name = 'Take';
  public constructor(public readonly n: number) {
    super();
  }

  public runOnView(xs: View<A>): View<A> {
    return xs.take(this.n);
  }
  public runOnList(xs: List<A>): List<A> {
    return xs.take(this.n);
  }

  static readonly Arb = fc.integer().map(x => new TakeAction(x));
}
class DropAction<A> extends Action<A, A> {
  readonly name = 'Drop';
  public constructor(public readonly n: number) {
    super();
  }

  public runOnView(xs: View<A>): View<A> {
    return xs.drop(this.n);
  }
  public runOnList(xs: List<A>): List<A> {
    return xs.drop(this.n);
  }

  static readonly Arb = fc.integer().map(x => new DropAction(x));
}
class FilterAction<A> extends Action<A, A> {
  readonly name = 'Filter';
  public constructor(public readonly f: (a: A) => boolean) {
    super();
  }

  public runOnView(xs: View<A>): View<A> {
    return xs.filter(this.f);
  }
  public runOnList(xs: List<A>): List<A> {
    return xs.filter(this.f);
  }

  static readonly Arb = fc.func(fc.boolean()).map(f => new FilterAction(f));
}
class FilterNotAction<A> extends Action<A, A> {
  readonly name = 'FilterNot';
  public constructor(public readonly f: (a: A) => boolean) {
    super();
  }

  public runOnView(xs: View<A>): View<A> {
    return xs.filterNot(this.f);
  }
  public runOnList(xs: List<A>): List<A> {
    return xs.filterNot(this.f);
  }

  static readonly Arb = fc.func(fc.boolean()).map(f => new FilterNotAction(f));
}
class CollectAction<A, B> extends Action<A, B> {
  readonly name = 'Collect';
  public constructor(public readonly f: (a: A) => Option<B>) {
    super();
  }

  public runOnView(xs: View<A>): View<B> {
    return xs.collect(this.f);
  }
  public runOnList(xs: List<A>): List<B> {
    return xs.collect(this.f);
  }

  static readonly Arb = fc
    .func(A.fp4tsOption(fc.integer()))
    .map(f => new CollectAction(f));
}
class ConcatAction<A> extends Action<A, A> {
  readonly name = 'Concat';
  public constructor(public readonly that: View<A>) {
    super();
  }

  public runOnView(xs: View<A>): View<A> {
    return xs.concat(this.that);
  }
  public runOnList(xs: List<A>): List<A> {
    return xs.concat(this.that.toList);
  }

  static readonly Arb = A.fp4tsView(fc.integer()).map(
    xs => new ConcatAction(xs),
  );
}
class MapAction<A, B> extends Action<A, B> {
  readonly name = 'Map';
  public constructor(public readonly f: (a: A) => B) {
    super();
  }

  public runOnView(xs: View<A>): View<B> {
    return xs.map(this.f);
  }
  public runOnList(xs: List<A>): List<B> {
    return xs.map(this.f);
  }

  static readonly Arb = fc.func(fc.integer()).map(f => new MapAction(f));
}
class FlatMapAction<A, B> extends Action<A, B> {
  readonly name = 'FlatMap';
  public constructor(public readonly f: (a: A) => View<B>) {
    super();
  }

  public runOnView(xs: View<A>): View<B> {
    return xs.flatMap(this.f);
  }
  public runOnList(xs: List<A>): List<B> {
    return xs.flatMap(x => this.f(x).toList);
  }

  static readonly Arb = fc
    .func(A.fp4tsView(fc.integer()))
    .map(f => new FlatMapAction(f));
}
class ZipAction<A, B> extends Action<A, [A, B]> {
  readonly name = 'Zip';
  public constructor(public readonly that: View<B>) {
    super();
  }

  public runOnView(xs: View<A>): View<[A, B]> {
    return xs.zip(this.that);
  }
  public runOnList(xs: List<A>): List<[A, B]> {
    return xs.zip(this.that.toList);
  }

  static readonly Arb = A.fp4tsView(fc.integer()).map(xs => new ZipAction(xs));
}
class ZipWithAction<A, B, C> extends Action<A, C> {
  readonly name = 'ZipWith';
  public constructor(
    public readonly that: View<B>,
    public readonly f: (a: A, b: B) => C,
  ) {
    super();
  }

  public runOnView(xs: View<A>): View<C> {
    return xs.zipWith(this.that, this.f);
  }
  public runOnList(xs: List<A>): List<C> {
    return xs.zipWith(this.that.toList, this.f);
  }

  static readonly Arb = fc
    .tuple(A.fp4tsView(fc.integer()), fc.func(fc.integer()))
    .map(([xs, f]) => new ZipWithAction(xs, f));
}
class ZipAllAction<A, B> extends Action<A, [A, B]> {
  readonly name = 'ZipAll';
  public constructor(
    public readonly that: View<B>,
    public readonly defaultL: () => A,
    public readonly defaultR: () => B,
  ) {
    super();
  }

  public runOnView(xs: View<A>): View<[A, B]> {
    return xs.zipAll(this.that, this.defaultL, this.defaultR);
  }
  public runOnList(xs: List<A>): List<[A, B]> {
    return xs.zipAll(this.that.toList, this.defaultL, this.defaultR);
  }

  static readonly Arb = fc
    .tuple(A.fp4tsView(fc.integer()), fc.integer(), fc.integer())
    .map(
      ([xs, dl, dr]) =>
        new ZipAllAction(
          xs,
          () => dl,
          () => dr,
        ),
    );
}
class ZipAllWithAction<A, B, C> extends Action<A, C> {
  readonly name = 'ZipAllWith';
  public constructor(
    public readonly that: View<B>,
    public readonly defaultL: () => A,
    public readonly defaultR: () => B,
    public readonly f: (a: A, b: B) => C,
  ) {
    super();
  }

  public runOnView(xs: View<A>): View<C> {
    return xs.zipAllWith(this.that, this.defaultL, this.defaultR, this.f);
  }
  public runOnList(xs: List<A>): List<C> {
    return xs.zipAllWith(
      this.that.toList,
      this.defaultL,
      this.defaultR,
      this.f,
    );
  }

  static readonly Arb = fc
    .tuple(
      A.fp4tsView(fc.integer()),
      fc.integer(),
      fc.integer(),
      fc.func(fc.integer()),
    )
    .map(
      ([xs, dl, dr, f]) =>
        new ZipAllWithAction(
          xs,
          () => dl,
          () => dr,
          f,
        ),
    );
}
class FoldLeftAction<A, B> extends Action<A, B> {
  readonly name = 'FoldLeft';
  public constructor(
    public readonly z: B,
    public readonly f: (b: B, a: A) => B,
  ) {
    super();
  }

  public runOnView(xs: View<A>): View<B> {
    return View(xs.foldLeft(this.z, this.f));
  }
  public runOnList(xs: List<A>): List<B> {
    return List(xs.foldLeft(this.z, this.f));
  }

  static readonly Arb = fc
    .tuple(fc.integer(), fc.func(fc.integer()))
    .map(([z, f]) => new FoldLeftAction(z, f));
}
class FoldRightAction<A, B> extends Action<A, B> {
  readonly name = 'FoldRight';
  public constructor(
    public readonly ez: Eval<B>,
    public readonly f: (a: A, eb: Eval<B>) => Eval<B>,
  ) {
    super();
  }

  public runOnView(xs: View<A>): View<B> {
    return View(xs.foldRight(this.ez, this.f).value);
  }
  public runOnList(xs: List<A>): List<B> {
    return List(xs.foldRight(this.ez, this.f).value);
  }

  static readonly Arb = fc
    .tuple(A.fp4tsEval(fc.integer()), fc.func(A.fp4tsEval(fc.integer())))
    .map(([z, f]) => new FoldRightAction(z, f));
}
class ScanLeftAction<A, B> extends Action<A, B> {
  readonly name = 'ScanLeft';
  public constructor(
    public readonly z: B,
    public readonly f: (b: B, a: A) => B,
  ) {
    super();
  }

  public runOnView(xs: View<A>): View<B> {
    return xs.scanLeft(this.z, this.f);
  }
  public runOnList(xs: List<A>): List<B> {
    return xs.scanLeft(this.z, this.f);
  }

  static readonly Arb = fc
    .tuple(fc.integer(), fc.func(fc.integer()))
    .map(([z, f]) => new ScanLeftAction(z, f));
}

describe('fusion', () => {
  const actionArb: Arbitrary<Action<unknown, unknown>> = fc.oneof(
    PrependAction.Arb,
    AppendAction.Arb,
    TakeAction.Arb,
    DropAction.Arb,
    FilterAction.Arb,
    FilterNotAction.Arb,
    CollectAction.Arb,
    ConcatAction.Arb,
    MapAction.Arb,
    FlatMapAction.Arb,
    ZipAction.Arb,
    ZipWithAction.Arb,
    ZipAllAction.Arb,
    ZipAllWithAction.Arb,
    FoldLeftAction.Arb,
    FoldRightAction.Arb,
    ScanLeftAction.Arb,
  );
  const actionsArb = fc.array(actionArb, { minLength: 100, maxLength: 10000 });

  it(
    'should be isomorphic to List operations',
    forAll(actionsArb, A.fp4tsView(fc.integer()), (as, xs) =>
      expect(
        as.reduce<View<unknown>>((xs, a) => a.runOnView(xs), xs).toArray,
      ).toEqual(
        as.reduce<List<unknown>>((xs, a) => a.runOnList(xs), xs.toList).toArray,
      ),
    ),
  );
});
