// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, Eval, HKT, Kind, Lazy, lazyVal, TyK, TyVar } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Alternative } from '../alternative';
import { Applicative } from '../applicative';
import { CoflatMap } from '../coflat-map';
import { EqK } from '../eq-k';
import { Functor } from '../functor';
import { FunctorFilter } from '../functor-filter';
import { Monad } from '../monad';
import { MonoidK } from '../monoid-k';
import { TraversableFilter } from '../traversable-filter';
import { Either, Left, Right } from './either';
import { List } from './collections';

export type Option<A> = _Option<A>;
export const Option: OptionObj = function <A>(
  value: A | null | undefined,
): Option<A> {
  return Option.fromNullable(value);
} as any;

abstract class _Option<out A> {
  private readonly __void!: void;
  private readonly _A!: () => A;

  public get isEmpty(): boolean {
    return (this as Option<A>) === None;
  }
  public get nonEmpty(): boolean {
    return (this as Option<A>) !== None;
  }

  public abstract readonly get: A;

  public get toList(): List<A> {
    return (this as Option<A>) === None ? List.empty : List(this.get);
  }

  public toLeft<B>(right: Lazy<B>): Either<A, B> {
    return (this as Option<A>) === None ? Right(right()) : Left(this.get);
  }
  public toRight<B>(left: Lazy<B>): Either<B, A> {
    return (this as Option<A>) === None ? Left(left()) : Right(this.get);
  }

  public fold<B1, B2 = B1>(onNone: () => B1, onSome: (a: A) => B2): B1 | B2 {
    return (this as Option<A>) === None ? onNone() : onSome(this.get);
  }

  public map<B>(f: (a: A) => B): Option<B> {
    return (this as Option<A>) === None ? None : new _Some(f(this.get));
  }

  public tap(f: (a: A) => unknown): Option<A> {
    return this.map(a => (f(a), a));
  }

  public map2<B, C>(that: Option<B>, f: (a: A, b: B) => C): Option<C> {
    return (this as Option<A>) === None || that === None
      ? None
      : new _Some(f(this.get, that.get));
  }
  public map2Eval<B, C>(
    that: Eval<Option<B>>,
    f: (a: A, b: B) => C,
  ): Eval<Option<C>> {
    return (this as Option<A>) === None
      ? Eval.now(None)
      : that.map(that =>
          that === None ? None : new _Some(f(this.get, that.get)),
        );
  }

  public filter<B extends A>(f: (a: A) => a is B): Option<B>;
  public filter(f: (a: A) => boolean): Option<A>;
  public filter(f: (a: A) => boolean): Option<A> {
    return (this as Option<A>) !== None && f(this.get) ? this : None;
  }

  public collect<B>(f: (a: A) => Option<B>): Option<B> {
    return this.flatMap(f);
  }

  public orElse<A>(this: Option<A>, that: Lazy<Option<A>>): Option<A> {
    return this === None ? that() : this;
  }
  public '<|>'<A>(this: Option<A>, that: Lazy<Option<A>>): Option<A> {
    return this.orElse(that);
  }
  public orElseEval<A>(
    this: Option<A>,
    that: Eval<Option<A>>,
  ): Eval<Option<A>> {
    return this === None ? that : Eval.now(this);
  }

  public getOrElse<A>(this: Option<A>, defaultValue: Lazy<A>): A {
    return (this as Option<A>) === None ? defaultValue() : this.get;
  }
  public getOrNull(): A | null {
    return this.getOrElse(() => null);
  }
  public getOrUndefined(): A | undefined {
    return this.getOrElse(() => undefined);
  }

  public flatMap<B>(f: (a: A) => Option<B>): Option<B> {
    return (this as Option<A>) === None ? None : f(this.get);
  }
  public flatten<B>(this: Option<Option<B>>): Option<B> {
    return this === None ? None : this.get;
  }

  public foldMap<M>(M: Monoid<M>): (f: (a: A) => M) => M {
    return f => ((this as Option<A>) === None ? M.empty : f(this.get));
  }
  public foldMapK<F>(
    F: MonoidK<F>,
  ): <B>(f: (a: A) => Kind<F, [B]>) => Kind<F, [B]> {
    return f => ((this as Option<A>) === None ? F.emptyK() : f(this.get));
  }

  public foldLeft<B>(z: B, f: (b: B, a: A) => B): B {
    return (this as Option<A>) === None ? z : f(z, this.get);
  }

  public foldRight<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>): Eval<B> {
    return (this as Option<A>) === None ? ez : f(this.get, ez);
  }

  public traverse<G>(
    G: Applicative<G>,
  ): <B>(f: (a: A) => Kind<G, [B]>) => Kind<G, [Option<B>]> {
    return f =>
      (this as Option<A>) === None ? G.pure(None) : G.map_(f(this.get), Some);
  }

  public traverseFilter<G>(
    G: Applicative<G>,
  ): <B>(f: (a: A) => Kind<G, [Option<B>]>) => Kind<G, [Option<B>]> {
    return f => ((this as Option<A>) === None ? G.pure(None) : f(this.get));
  }

  public equals<A>(
    this: Option<A>,
    that: Option<A>,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): boolean {
    if (this === that) return true;
    if (this === None || that === None) return false;
    return E.equals(this.get, that.get);
  }
}

export const Some = <A>(a: A): Option<A> => new _Some(a);
class _Some<A> extends _Option<A> {
  public constructor(public readonly get: A) {
    super();
  }

  public override toString(): string {
    return `Some(${this.get})`;
  }
}

export const None: Option<never> = new (class None extends _Option<never> {
  public get get(): never {
    throw new Error('None.get');
  }

  public override toString(): string {
    return 'None';
  }
})();

Option.fromNullable = <A>(value: A | null | undefined): Option<A> =>
  value == null ? None : new _Some(value);
Option.pure = Some;
Option.fromEither = <A>(ea: Either<unknown, A>): Option<A> =>
  ea.isRight ? new _Some(ea.get) : None;
Option.tailRecM_ = <A, B>(
  a: A,
  f: (a: A) => Option<Either<A, B>>,
): Option<B> => {
  let cur: Option<Either<A, B>> = f(a);
  while (cur !== None) {
    const ea = cur.get;
    if (ea.isRight) return new _Some(ea.get);
    cur = f(ea.getLeft);
  }
  return None;
};

interface OptionObj {
  <A>(value: A | null | undefined): Option<A>;
  pure<A>(value: A): Option<A>;
  fromNullable<A>(value: A | null | undefined): Option<A>;
  fromEither<A>(ea: Either<unknown, A>): Option<A>;
  tailRecM_<A, B>(a: A, f: (a: A) => Option<Either<A, B>>): Option<B>;

  // -- Instances

  Eq<A>(a: Eq<A>): Eq<Option<A>>;
  EqK: EqK<OptionF>;
  Functor: Functor<OptionF>;
  FunctorFilter: FunctorFilter<OptionF>;
  CoflatMap: CoflatMap<OptionF>;
  Alternative: Alternative<OptionF>;
  Monad: Monad<OptionF>;
  TraversableFilter: TraversableFilter<OptionF>;
}

Option.Eq = <A>(E: Eq<A>): Eq<Option<A>> =>
  Eq.of({ equals: (fa, fb) => fa.equals(fb, E) });

const optionEqK = lazyVal(() =>
  EqK.of<OptionF>({ liftEq: <A>(E: Eq<A>) => Option.Eq(E) }),
);

const optionFunctor = lazyVal(() =>
  Functor.of<OptionF>({ map_: (fa, f) => fa.map(f) }),
);
const optionFunctorFilter = lazyVal(() =>
  FunctorFilter.of<OptionF>({
    ...optionFunctor(),
    mapFilter_: (fa, f) => fa.collect(f),
    collect_: (fa, f) => fa.collect(f),
    filter_: ((fa: any, f: any) =>
      fa.filter(f)) as FunctorFilter<OptionF>['filter_'],
  }),
);

const optionAlternative = lazyVal(() =>
  Alternative.of<OptionF>({
    ...optionMonad(),
    combineK_: (fa, lfb) => fa.orElse(() => lfb),
    combineKEval_: (fa, efb) => fa.orElseEval(efb),
    emptyK: () => None,
  }),
);

const optionCoflatMap = lazyVal(() => Applicative.coflatMap(optionMonad()));

const optionMonad = lazyVal(() =>
  Monad.of<OptionF>({
    ...optionFunctor(),
    pure: Option.pure,
    map2_:
      <A, B>(fa: Option<A>, fb: Option<B>) =>
      <C>(f: (a: A, b: B) => C) =>
        fa.map2(fb, f),
    map2Eval_:
      <A, B>(fa: Option<A>, efb: Eval<Option<B>>) =>
      <C>(f: (a: A, b: B) => C) =>
        fa.map2Eval(efb, f),
    flatMap_: (fa, f) => fa.flatMap(f),
    flatten: fa => fa.flatten(),
    tailRecM_: Option.tailRecM_,
  }),
);

const optionTraversableFilter = lazyVal(() =>
  TraversableFilter.of<OptionF>({
    ...optionFunctorFilter(),
    traverseFilter_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: Option<A>, f: (a: A) => Kind<G, [Option<B>]>) =>
        fa.traverseFilter(G)(f),
    traverse_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: Option<A>, f: (a: A) => Kind<G, [B]>) =>
        fa.traverse(G)(f),
    foldMap_:
      <M>(M: Monoid<M>) =>
      <A>(fa: Option<A>, f: (a: A) => M) =>
        fa.foldMap(M)(f),
    foldLeft_: (fa, z, f) => fa.foldLeft(z, f),
    foldRight_: (fa, z, f) => fa.foldRight(z, f),
    isEmpty: fa => fa.isEmpty,
    nonEmpty: fa => fa.nonEmpty,
    toList: fa => fa.toList,
  }),
);

Object.defineProperty(Option, 'EqK', {
  get() {
    return optionEqK();
  },
});
Object.defineProperty(Option, 'Functor', {
  get() {
    return optionFunctor();
  },
});
Object.defineProperty(Option, 'FunctorFilter', {
  get() {
    return optionFunctorFilter();
  },
});
Object.defineProperty(Option, 'CoflatMap', {
  get() {
    return optionCoflatMap();
  },
});
Object.defineProperty(Option, 'Alternative', {
  get() {
    return optionAlternative();
  },
});
Object.defineProperty(Option, 'Monad', {
  get() {
    return optionMonad();
  },
});
Object.defineProperty(Option, 'TraversableFilter', {
  get() {
    return optionTraversableFilter();
  },
});

// -- HKT

interface _Option<A> extends HKT<OptionF, [A]> {}

/**
 * @category Type Constructor
 * @category Data
 */
export interface OptionF extends TyK<[unknown]> {
  [$type]: Option<TyVar<this, 0>>;
}
