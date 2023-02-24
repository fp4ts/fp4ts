// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Eval, HKT, Kind, Lazy, lazy, TyK, TyVar } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Applicative } from '../applicative';
import { Bifunctor } from '../bifunctor';
import { EqK } from '../eq-k';
import { Monad } from '../monad';
import { MonadError } from '../monad-error';
import { MonoidK } from '../monoid-k';
import { SemigroupK } from '../semigroup-k';
import { Traversable } from '../traversable';
import { List } from './collections';
import { None, Option, Some } from './option';

export type Either<E, A> = _Either<E, A>;

export const Either: EitherObj = function <A, E = never>(
  value: A,
): Either<E, A> {
  return Right(value);
} as any;
export const Left = <E, A = never>(e: E): Either<E, A> => new _Left(e);
export const Right = <A, E = never>(a: A): Either<E, A> => new _Right(a);

abstract class _Either<out E, out A> {
  private __void!: void;
  private _E!: () => E;
  private _A!: () => A;

  public abstract readonly isEmpty: boolean;
  public get nonEmpty(): boolean {
    return !this.isEmpty;
  }

  public isLeft(): this is Either<E, never> {
    return this.isEmpty;
  }

  public isRight(): this is Either<never, A> {
    return this.nonEmpty;
  }

  public abstract getLeft: E;
  public abstract get: A;

  public get toOption(): Option<A> {
    return this.isEmpty ? None : Some(this.get);
  }
  public get toList(): List<A> {
    return this.isEmpty ? List.empty : List(this.get);
  }
  public get toArray(): A[] {
    return this.isEmpty ? [] : [this.get];
  }

  public get swapped(): Either<A, E> {
    return this.isEmpty ? new _Right(this.getLeft) : new _Left(this.get);
  }

  public fold<B1, B2 = B1>(
    onLeft: (e: E) => B1,
    onRight: (a: A) => B2,
  ): B1 | B2 {
    return this.isEmpty ? onLeft(this.getLeft) : onRight(this.get);
  }

  public map<B>(f: (a: A) => B): Either<E, B> {
    return this.isEmpty
      ? (this as any as Either<E, B>)
      : new _Right(f(this.get));
  }

  public tap(f: (a: A) => unknown): Either<E, A> {
    return this.isEmpty ? this : (f(this.get), this);
  }

  public leftMap<E2>(f: (e: E) => E2): Either<E2, A> {
    return this.isEmpty
      ? new _Left(f(this.getLeft))
      : (this as any as Either<E2, A>);
  }

  public bimap<E2, B>(f: (e: E) => E2, g: (a: A) => B): Either<E2, B> {
    return this.isEmpty ? new _Left(f(this.getLeft)) : new _Right(g(this.get));
  }

  public orElse<E, B>(
    this: Either<E, B>,
    that: Lazy<Either<E, B>>,
  ): Either<E, B> {
    return this.isEmpty ? that() : this;
  }
  public '<|>'<E2, B>(
    this: Either<E2, B>,
    that: Lazy<Either<E2, B>>,
  ): Either<E2, B> {
    return this.orElse(that);
  }
  public orElseEval<E2, B>(
    this: Either<E2, B>,
    that: Eval<Either<E2, B>>,
  ): Eval<Either<E2, B>> {
    return this.isEmpty ? that : Eval.now(this);
  }

  public getOrElse<A>(this: Either<E, A>, defaultValue: Lazy<A>): A {
    return this.isEmpty ? defaultValue() : this.get;
  }

  public map2<E, B, C>(
    this: Either<E, A>,
    that: Either<E, B>,
    f: (a: A, b: B) => C,
  ): Either<E, C> {
    return this.isEmpty
      ? (this as any as Either<E, C>)
      : that.isEmpty
      ? (that as any as Either<E, C>)
      : new _Right(f(this.get, that.get));
  }

  public map2Eval<E, B, C>(
    this: Either<E, A>,
    that: Eval<Either<E, B>>,
    f: (a: A, b: B) => C,
  ): Eval<Either<E, C>> {
    return this.isEmpty
      ? Eval.now(this as any as Either<E, C>)
      : that.map(that =>
          that.isEmpty
            ? (that as any as Either<E, C>)
            : new _Right(f(this.get, that.get)),
        );
  }

  public flatMap<E, B>(
    this: Either<E, A>,
    f: (a: A) => Either<E, B>,
  ): Either<E, B> {
    return this.isEmpty ? (this as any as Either<E, B>) : f(this.get);
  }

  public leftFlatMap<A, E2>(
    this: Either<E, A>,
    f: (e: E) => Either<E2, A>,
  ): Either<E2, A> {
    return this.isEmpty ? f(this.getLeft) : (this as any as Either<E2, A>);
  }

  public flatten<E, B>(this: Either<E, Either<E, B>>): Either<E, B> {
    return this.isEmpty ? (this as any as Either<E, B>) : this.get;
  }

  public foldMap<M>(M: Monoid<M>): (f: (a: A) => M) => M {
    return f => (this.isEmpty ? M.empty : f(this.get));
  }
  public foldMapK<F>(
    F: MonoidK<F>,
  ): <B>(f: (a: A) => Kind<F, [B]>) => Kind<F, [B]> {
    return f => (this.isEmpty ? F.emptyK() : f(this.get));
  }

  public foldLeft<B>(z: B, f: (b: B, a: A) => B): B {
    return this.isEmpty ? z : f(z, this.get);
  }
  public foldRight<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>): Eval<B> {
    return this.isEmpty ? ez : f(this.get, ez);
  }

  public traverse<G>(
    G: Applicative<G>,
  ): <B>(f: (a: A) => Kind<G, [B]>) => Kind<G, [Either<E, B>]> {
    return <B>(f: (a: A) => Kind<G, [B]>) =>
      this.isEmpty
        ? G.pure(this as any as Either<E, B>)
        : G.map_(f(this.get), Right);
  }

  public equals<E, A>(
    this: Either<E, A>,
    that: Either<E, A>,
    EE: Eq<E> = Eq.fromUniversalEquals(),
    EA: Eq<A> = Eq.fromUniversalEquals(),
  ): boolean {
    if (this === that) return true;
    if (this.isEmpty !== that.isEmpty) return false;
    return this.isEmpty
      ? EE.equals(this.getLeft, that.getLeft)
      : EA.equals(this.get, that.get);
  }
}

class _Left<E> extends _Either<E, never> {
  public constructor(public readonly getLeft: E) {
    super();
  }

  public readonly isEmpty: boolean = true;

  public get get(): never {
    throw new Error('Left.get');
  }

  public override toString(): string {
    return `Left(${this.getLeft})`;
  }
}

class _Right<A> extends _Either<never, A> {
  public constructor(public readonly get: A) {
    super();
  }

  public readonly isEmpty: boolean = false;

  public get getLeft(): never {
    throw new Error('Right.getLeft');
  }

  public override toString(): string {
    return `Right(${this.get})`;
  }
}

Either.pure = Right;
Either.rightUnit = Right(undefined as void);

Either.tailRecM_ = <A, E, B>(
  a0: A,
  f: (a: A) => Either<E, Either<A, B>>,
): Either<E, B> => {
  let cur: Either<E, Either<A, B>> = f(a0);
  while (cur.nonEmpty) {
    const inner = cur.get;
    if (inner.nonEmpty) return inner as any as Either<E, B>;
    cur = f(inner.getLeft);
  }
  return cur as any as Either<E, B>;
};

interface EitherObj {
  <A, E = never>(a: A): Either<E, A>;
  pure<A, E = never>(a: A): Either<E, A>;
  rightUnit: Either<never, void>;
  tailRecM_<A, E, B>(a0: A, f: (a: A) => Either<E, Either<A, B>>): Either<E, B>;

  // -- Instances

  Eq<E, A>(EE: Eq<E>, EA: Eq<A>): Eq<Either<E, A>>;
  EqK<E>(EE: Eq<E>): EqK<$<EitherF, [E]>>;
  Bifunctor: Bifunctor<EitherF>;
  SemigroupK<E>(): SemigroupK<$<EitherF, [E]>>;
  Monad<E>(): Monad<$<EitherF, [E]>>;
  MonadError<E>(): MonadError<$<EitherF, [E]>, E>;
  Traversable<E>(): Traversable<$<EitherF, [E]>>;
}

// -- Instances

const eitherEqK = <E>(EE: Eq<E>): EqK<$<EitherF, [E]>> =>
  EqK.of<$<EitherF, [E]>>({ liftEq: <A>(EA: Eq<A>) => Either.Eq(EE, EA) });

const eitherSemigroupK = lazy(
  <E>(): SemigroupK<$<EitherF, [E]>> =>
    SemigroupK.of<$<EitherF, [E]>>({
      combineK_: (fa, fb) => fa.orElse(() => fb),
      combineKEval_: (fa, efb) => fa.orElseEval(efb),
    }),
) as <E>() => SemigroupK<$<EitherF, [E]>>;

const eitherBifunctor = lazy(() =>
  Bifunctor.of<EitherF>({
    bimap_: (fa, f, g) => fa.bimap(f, g),
    map_: (fa, f) => fa.map(f),
    leftMap_: (fa, f) => fa.leftMap(f),
  }),
);

const eitherMonad = lazy(
  <E>(): Monad<$<EitherF, [E]>> =>
    Monad.of<$<EitherF, [E]>>({
      pure: Either.pure,
      map_: (fa, f) => fa.map(f),
      map2_: (fa, fb, f) => fa.map2(fb, f),
      map2Eval_: (fa, efb, f) => fa.map2Eval(efb, f),
      flatMap_: (fa, f) => fa.flatMap(f),
      flatten: fa => fa.flatten(),
      tailRecM_: Either.tailRecM_,
    }),
) as <E>() => Monad<$<EitherF, [E]>>;

const eitherMonadError = lazy(
  <E>(): MonadError<$<EitherF, [E]>, E> =>
    MonadError.of<$<EitherF, [E]>, E>({
      ...eitherMonad<E>(),
      throwError: Left,
      handleErrorWith_: (fa, h) => fa.leftFlatMap(h),
    }),
) as <E>() => MonadError<$<EitherF, [E]>, E>;

const eitherTraversable = lazy(
  <E>(): Traversable<$<EitherF, [E]>> =>
    Traversable.of<$<EitherF, [E]>>({
      traverse_:
        <G>(G: Applicative<G>) =>
        <A, B>(fa: Either<E, A>, f: (a: A) => Kind<G, [B]>) =>
          fa.traverse(G)(f),
      foldMap_:
        <M>(M: Monoid<M>) =>
        <A>(fa: Either<E, A>, f: (a: A) => M) =>
          fa.foldMap(M)(f),
      foldMapLeft_:
        <M>(M: Monoid<M>) =>
        <A>(fa: Either<E, A>, f: (a: A) => M) =>
          fa.foldMap(M)(f),
      foldLeft_: (fa, z, f) => fa.foldLeft(z, f),
      foldRight_: (fa, ez, f) => fa.foldRight(ez, f),
      isEmpty: fa => fa.isEmpty,
      nonEmpty: fa => fa.nonEmpty,
      toArray: fa => fa.toArray,
    }),
) as <E>() => Traversable<$<EitherF, [E]>>;

Either.Eq = <E, A>(EE: Eq<E>, EA: Eq<A>): Eq<Either<E, A>> =>
  Eq.of<Either<E, A>>({ equals: (x, y) => x.equals(y, EE, EA) });

Either.EqK = eitherEqK;
Either.SemigroupK = eitherSemigroupK;
Object.defineProperty(Either, 'Bifunctor', {
  get() {
    return eitherBifunctor();
  },
});
Either.Monad = eitherMonad;
Either.MonadError = eitherMonadError;
Either.Traversable = eitherTraversable;

// -- HKT

interface _Either<E, A> extends HKT<EitherF, [E, A]> {}

/**
 * @category Type Constructor
 * @category Data
 */
export interface EitherF extends TyK<[unknown, unknown]> {
  [$type]: Either<TyVar<this, 0>, TyVar<this, 1>>;
}
